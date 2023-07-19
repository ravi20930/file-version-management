const { DataTypes } = require('sequelize');
const sequelize = require('../config/db');

const UploadedFile = sequelize.define('uploadedFile', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
        allowNull: false,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    siteName: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    version: {
        type: DataTypes.FLOAT,
        allowNull: false,
        defaultValue: 1,
    },
    // Add more fields as needed (e.g., file size, file type, etc.)
});

module.exports = UploadedFile;
