const mongoose = require('../mongo');

const botTypeSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  note: String,
});


const BotType = mongoose.model('BotType', botTypeSchema);

module.exports = BotType;
