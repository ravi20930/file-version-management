require("dotenv").config();
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const bodyParser = require('body-parser');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const UploadFile = require('./models/uploadFile');
const sequelize = require('./config/db');
const fs = require('fs');

const app = express();
// Parse request bodies
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));
const server = http.createServer(app);
const io = socketIO(server);

const PORT = 4000;

// Create the uploads folder if it doesn't exist
const UPLOADS_FOLDER = process.env.UPLOADS_FOLDER;
if (!fs.existsSync(UPLOADS_FOLDER)) {
    fs.mkdirSync(UPLOADS_FOLDER);
}
app.use(cors());
app.use(express.static(UPLOADS_FOLDER));

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Set the destination folder based on the siteName
        const siteName = req.body.siteName;
        const siteUploadsFolder = UPLOADS_FOLDER+"/"+siteName;
        if (!fs.existsSync(siteUploadsFolder)) {
            fs.mkdirSync(siteUploadsFolder, { recursive: true });
        }
        cb(null, siteUploadsFolder);
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname);
    },
});

const upload = multer({ storage });

app.post('/upload', upload.array('files', 10), async (req, res) => {
    try {
        const filePromises = req.files.map(async (file) => {
            // Save necessary information about each uploaded file in the database
            return UploadFile.create({
                name: file.originalname,
                version: req.body.version,
                siteName: req.body.siteName,
            });
        });

        // Wait for all files to be saved to the database
        await Promise.all(filePromises);

        // Emit a socket event after successful update
        io.emit('filesUploaded', { count: req.files.length });

        res.status(200).json({ message: 'Files uploaded successfully!' });
    } catch (err) {
        console.error('Error while uploading files:', err);
        res.status(500).json({ error: 'Failed to upload files.' });
    }
});

// Start the server after establishing the database connection
sequelize
    .sync({ alter: false })
    .then(() => {
        server.listen(PORT, () => {
            console.log(`Server is running on http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error('Error connecting to the database:', err);
    });
