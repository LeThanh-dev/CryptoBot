const mongoose = require('../index');

const botSchema = new mongoose.Schema({
  botName: String,
  Balance: Number,
  botType: String,
  Status: String,
  Server: String,
  Version: String,
  note: String,
  telegramID: String,
  spotSavings: Number,
  Created: Date,
  userID: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
  },
});


const Bot = mongoose.model('Bot', botSchema);

module.exports = Bot;
