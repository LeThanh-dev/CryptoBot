const mongoose = require('mongoose');

const mongodbServerIP = "103.179.188.76"
mongoose.connect(`mongodb://${mongodbServerIP}:27017/crypto-bot`, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('[V] Connected to MongoDB successful');
}).catch((err) => {
  console.error('Error connecting to MongoDB:', err);
});

module.exports = mongoose;