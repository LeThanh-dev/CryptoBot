const mongoose = require('../mongo');

const InstrumentOKXV1Schema = new mongoose.Schema({
  symbol: String,
  minSz: String,
  lotSz: String,
  market: String,
  tickSz: String,
});


const InstrumentOKXV1 = mongoose.model('InstrumentOKXV1', InstrumentOKXV1Schema);

module.exports = InstrumentOKXV1;
