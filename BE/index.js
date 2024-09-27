const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(`mongodb://${process.env.U_MONG}:${process.env.P_MONG}@localhost:27017/crypto-bot`, {
  useNewUrlParser: true,
  useUnifiedTopology: true
}).then(() => {
  console.log('Connected to MongoDB');
}).catch((err) => {
  console.error('Error connecting to MongoDB:', err);
});

module.exports = mongoose;