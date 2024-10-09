const cron = require('node-cron');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const TelegramBot = require('node-telegram-bot-api');
require('dotenv').config();

const TOKEN = process.env.TOKEN_BK;
const CHAT_ID = process.env.CHAT_ID_BK;

const MONGO_URI = 'mongodb://localhost:27017/crypto-bot'; // URI kết nối MongoDB
const BACKUP_FILE = path.join(__dirname, 'bk', 'backup.gz');

const bot = new TelegramBot(TOKEN, {
    polling: false,
    request: {
        agentOptions: {
            family: 4
        }
    }
});

// Hàm kiểm tra và tạo thư mục nếu chưa tồn tại
function ensureDirectoryExistence(filePath) {
    const dirname = path.dirname(filePath);
    if (!fs.existsSync(dirname)) {
        fs.mkdirSync(dirname, { recursive: true });
    }
}

// Hàm sao lưu MongoDB
function backupDatabase() {
    return new Promise((resolve, reject) => {
        ensureDirectoryExistence(BACKUP_FILE); // Đảm bảo thư mục tồn tại

        exec(`mongodump --uri="${MONGO_URI}" --gzip --archive="${BACKUP_FILE}"`, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error executing mongodump: ${error.message}`);
                reject(error);
            } else {
                console.log('Database backup completed.');
                resolve();
            }
        });
    });
}

// Hàm gửi file sao lưu đến Telegram
function sendBackupToTelegram() {
    return new Promise((resolve, reject) => {
        
        bot.sendDocument(CHAT_ID, BACKUP_FILE, {
            caption: `Backup | ${new Date().toLocaleString()}`
        })
            .then(() => {
                console.log('Backup sent to Telegram.');
                resolve();
            })
            .catch(err => {
                console.log(`Error sending to Telegram: ${err}`);
                reject(err);
            });
    });
}

// Chạy sao lưu và gửi file
async function main() {
    try {
        await backupDatabase();
        await sendBackupToTelegram();
    } catch (err) {
        console.error(`Error: ${err.message}`);
    }
    // finally {
    //     // Xóa file sao lưu nếu không cần thiết lưu lại
    //     if (fs.existsSync(BACKUP_FILE)) {
    //         fs.unlinkSync(BACKUP_FILE);
    //     }
    // }
}


cron.schedule('0 */1 * * *', () => {
    main();
});