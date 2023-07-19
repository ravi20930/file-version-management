
const UploadFile = require("../models/uploadFile");
const { Sequelize } = require('sequelize');
exports.checkForUpdate = async (siteName) => {
    try {
        const result = await UploadFile.findOne({
            attributes: [
                [Sequelize.fn('MAX', Sequelize.col('version')), 'latestVersion'],
            ],
            where: {
                siteName: siteName,
            
            },
        });
        return JSON.parse(JSON.stringify(result));
    } catch (error) {
        console.error('Error:', error);
        throw error;
    }
}
