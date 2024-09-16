const mongoose = require('../index');

const instrumentsInfoSchema = new mongoose.Schema({
  symbol: String,
  minOrderQty: String,
  basePrecision: String,
  market: String,
  tickSize: String,
});


const InstrumentsInfo = mongoose.model('InstrumentsInfo', instrumentsInfoSchema);

module.exports = InstrumentsInfo;
