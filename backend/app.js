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
const { checkForUpdate } = require("./utils/update-check")

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

const ftp = require("basic-ftp")
const SftpClient = require('ssh2-sftp-client');

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Set the destination folder based on the siteName
        const siteName = req.body.siteName;
        const siteUploadsFolder = UPLOADS_FOLDER + "/" + siteName;
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
        const sftpConfig = {
            host: process.env.SFTP_HOST,
            port: parseInt(process.env.SFTP_PORT, 10) || 22, // Default SFTP port is 22
            username: process.env.SFTP_USERNAME,
            password: process.env.SFTP_PASSWORD,
        };
        // const ftpClient = new ftp.Client()
        // ftpClient.ftp.verbose = true;
        // await ftpClient.access(sftpConfig);
        const sftp = new SftpClient();
        await sftp.connect(sftpConfig);

        const siteName = req.body.siteName;
        const remoteMainDir = `/web/ml-gui`;
        const remoteSiteDir = `${remoteMainDir}/${siteName}`;

        // Upload each file to the SFTP server
        for (const file of req.files) {
            const remoteFilePath = `${remoteSiteDir}/${file.originalname}`;
            try {
                await sftp.mkdir(remoteSiteDir); // 'true' creates parent directories if they don't exist
            } catch (error) {
                console.error(`Error while creating directory ${remoteSiteDir}:`, error.message);
                // Handle the error as needed
            }
            try {
                await sftp.put(file.path, remoteFilePath);
            } catch (error) {
                console.error(`Error while uploading file ${file.originalname}:`, error.message);
                // Handle the error as needed
                // For example, you can skip this file and continue with the next one
            }
        }
        // for (const file of req.files) {
        //     const remoteFilePath = `${remoteSiteDir}/${file.originalname}`;
        //     await ftpClient.uploadFrom(file.path, remoteFilePath);
        // }
        // await ftpClient.close();

        await sftp.end(); // Close the SFTP connection

        // Save necessary information about each uploaded file in the database
        for (const file of req.files) {
            await UploadFile.create({
                name: file.originalname,
                version: req.body.version,
                siteName: req.body.siteName,
            });
        }

        // Emit a socket event after successful update
        io.emit('filesUploaded', { count: req.files.length });

        res.status(200).json({ message: 'Files uploaded successfully!' });
    } catch (err) {
        console.error('Error while uploading files:', err);
        res.status(500).json({ error: 'Failed to upload files.' });
    }
});






app.get('/check-for-update', async (req, res) => {
    try {
        const siteName = req.query.siteName;
        const d = await checkForUpdate(siteName);
        res.status(200).json(d);
    } catch (err) {
        console.error('Error while fetching for updates:', err);
        res.status(500).json({ error: 'Failed to check update.' });
    }
})

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
