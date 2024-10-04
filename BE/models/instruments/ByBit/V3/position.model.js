const mongoose = require('../../../../mongo');

const positionSchema = new mongoose.Schema({
  Symbol: {
    type: String,
    required: true,
  },
  Side: String,
  Price: String,
  Quantity	: String,
  Pnl: String,
  Time: Date,
  TimeUpdated: Date,
  Miss: Boolean,
  botID: {
    type: mongoose.Types.ObjectId,
    ref: 'Bot',
    required: true,
  },
});


const Position = mongoose.model('Position', positionSchema);
positionSchema.index({ Symbol: 1, botID: 1 }, { unique: true });

module.exports = Position;
