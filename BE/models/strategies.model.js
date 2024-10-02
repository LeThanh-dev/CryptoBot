const mongoose = require('..');

const childrenStrategiesSchema = new mongoose.Schema({
  PositionSide: String,
  Amount: Number,
  OrderChange: Number,
  Candlestick: String,
  TakeProfit: Number,
  ReduceTakeProfit: Number,
  ExtendedOCPercent: Number,
  Ignore: Number,
  EntryTrailing: Number,
  StopLose: Number,
  IsActive: Boolean,
  Remember: Boolean,
  TimeTemp: String,
  botID: {
    type: mongoose.Types.ObjectId,
    ref: 'Bot',
  },
  userID: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
  },
  scannerID: {
    type: mongoose.Types.ObjectId,
    ref: 'Scanner',
  },
  // Other
  symbol: String,
  value: String,
});

const strategiesSchema = new mongoose.Schema({
  label: {
    type: String,
    unique: true,
  },
  value: {
    type: String,
    unique: true,
  },
  volume24h: String,
  bookmarkList: [String],
  children: [childrenStrategiesSchema]
})


const Strategies = mongoose.model('Strategies', strategiesSchema);


module.exports = Strategies;
