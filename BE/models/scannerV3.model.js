const mongoose = require('..');

const strategiesSchema = new mongoose.Schema({
  botID: {
    type: mongoose.Types.ObjectId,
    ref: 'Bot',
  },
  Label: String,

  Frame: String,
  OCLength: Number,
  
  Candle: String,
  OnlyPairs	: [String],
  Blacklist	: [String],

  OrderChange: Number,
  Adjust: Number,
  
  Longest: String,
  Elastic: String,
  Ratio: String,

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
