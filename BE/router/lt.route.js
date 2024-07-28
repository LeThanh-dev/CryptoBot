const express = require('express');
const router = express.Router();
const multer = require('multer');
const unzipper = require('unzipper');
const fs = require('fs');
const path = require('path');

const upload = multer({ dest: 'uploads/' });

router.post('/rs', upload.single('file'), async (req, res) => {

    const mongoose = require('../index');

    const filePath = req.file?.path;

    if (!filePath) {
        return res.customResponse(500, "File not uploaded");
    }

    try {
        const fileNameZip = req.file.originalname.replace(".zip", "")
        // Giải nén file ZIP
        const extractPath = path.join('extracted', fileNameZip);
        await fs.promises.mkdir(extractPath, { recursive: true });

        fs.createReadStream(filePath)
            .pipe(unzipper.Extract({ path: extractPath }))
            .on('close', async () => {
                // Đọc dữ liệu từ file JSON trong thư mục giải nén
                const jsonFilePath = path.join(extractPath, `${fileNameZip}.json`);
                if (!fs.existsSync(jsonFilePath)) {
                    res.customResponse(400, "Backup file not found");
                }

                const data = JSON.parse(fs.readFileSync(jsonFilePath, 'utf-8'));

                // Khôi phục cơ sở dữ liệu từ dữ liệu JSON
                for (const [collectionName, documents] of Object.entries(data)) {
                    if (documents?.length) {
                        const collection = mongoose.connection.db.collection(collectionName);
                        await collection.deleteMany({});
                        // await collection.bulkWrite(documents.map(item => {
                        //     delete item._id
                        //     return {
                        //         updateOne: {
                        //             update: item
                        //         }
                        //     }
                        // }));
                        await collection.insertMany(documents.map(item => {
                            delete item._id
                            return item
                        }));
                    }
                }

                // Xóa file tạm
                fs.unlinkSync(filePath);
                // fs.unlinkSync(extractPath);

                res.customResponse(200, "RS successful.");
            })
            .on('error', (err) => {
                console.error('Error extracting file:', err);
                res.customResponse(500, "Error extracting file.");
            });

    } catch (error) {
        console.error('Error restoring database:', error);
        res.status(500).json({ message: 'Failed to restore database.' });
    }
});

module.exports = router;
