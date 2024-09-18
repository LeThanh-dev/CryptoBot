const mongoose = require('../index');

const strategiesSchema = new mongoose.Schema({
  botID: {
    type: mongoose.Types.ObjectId,
    ref: 'Bot',
  },
  Label: String,
  Frame: String,
  Candle: String,
  OnlyPairs	: [String],
  Blacklist	: [String],

  OrderChange: Number,
  Elastic: String,
  Amount: Number,
  PositionSide: String,
  Expire: Number,
  Limit: Number,

  TimeTemp: String,
  Turnover: Number,
  IsActive: Boolean,
 
  userID: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
  },
  // Other
  value: String,
  IsBookmark: Boolean,
})


const ScannerV3 = mongoose.model('ScannerV3', strategiesSchema);


module.exports = ScannerV3;
