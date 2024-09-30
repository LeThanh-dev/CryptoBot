const mongoose = require('mongoose');

const mongodbServerIP = "localhost"
mongoose.connect(`mongodb://${mongodbServerIP}:27017/crypto-bot`, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('Error connecting to MongoDB:', err);
});

module.exports = mongoose;