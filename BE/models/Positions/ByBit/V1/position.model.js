const mongoose = require('../../../../mongo');

const positionV1Schema = new mongoose.Schema({
  Symbol: {
    type: String,
    required: true,
  },
  Side: String,
  usdValue: String,
  Quantity: String,
  borrowAmount: String,
  TradeType: String,
  botID: {
    type: mongoose.Types.ObjectId,
    ref: 'Bot',
    required: true,
  },
  Time: Date,
  TimeUpdated: Date,
  Miss: Boolean,
  MaxQty: String
});


const PositionV1 = mongoose.model('PositionV1', positionV1Schema);
positionV1Schema.index({ Symbol: 1, botID: 1 }, { unique: true });

module.exports = PositionV1;
