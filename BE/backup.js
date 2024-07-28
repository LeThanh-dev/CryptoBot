const mongoose = require('mongoose');
const archiver = require('archiver');
const fs = require('fs');
const TelegramBot = require('node-telegram-bot-api');

const uri = 'mongodb://localhost:27017/crypto-bot';

// Telegram bot token and chat ID
const botToken = '7481938837:AAGCPVwxIXQqZIBV0Xzs03pqFp6jDcMQ59Y';
const chatId = '-1002240286907';

mongoose.connect(uri);

const exportDatabase = async () => {
  console.log('[...] Doing');
  const collections = await mongoose.connection.db.listCollections().toArray();
  const exportPromises = collections.map(collection => {
    return mongoose.connection.db.collection(collection.name).find({}).toArray();
  });

  const collectionsData = await Promise.all(exportPromises);
  const collectionsObject = collections.reduce((acc, collection, index) => {
    acc[collection.name] = collectionsData[index];
    return acc;
  }, {});

  const Time = new Date().toLocaleString('vi-vn')
    .replace(/[/,:]/g, '-')
    .replace(/\s+/g, '_');

  const fileName = `backup-${Time}.json`
  fs.writeFileSync(fileName, JSON.stringify(collectionsObject, null, 2));

  const fileNameZip = `backup-${Time}.zip`
  const output = fs.createWriteStream(fileNameZip);
  const archive = archiver('zip', {
    zlib: { level: 9 }
  });

  output.on('close', async () => {
    const bot = new TelegramBot(botToken);
    await bot.sendDocument(chatId, fileNameZip);
    fs.unlink(fileName, (err) => {
      if (err) {
        console.error('Failed to delete file:', err);
      } else {
        console.log('File deleted successfully.');
      }
    });
    fs.unlink(fileNameZip, (err) => {
      if (err) {
        console.error('Failed to delete file:', err);
      } else {
        console.log('File deleted successfully.');
      }
    });
    console.log('\n[V] Database backup sent to Telegram!');
    process.exit(0)
  });

  archive.pipe(output);
  archive.append(fs.createReadStream(fileName), { name: fileName });
  await archive.finalize();
};

mongoose.connection.once('open', exportDatabase);
mongoose.connection.on('error', console.error.bind(console, 'MongoDB connection error:'));
