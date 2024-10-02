const mongoose = require('..');

const coinSchema = new mongoose.Schema({
  symbol: String,
  volume24h: String,
});


const Coin = mongoose.model('Coin', coinSchema);

module.exports = Coin;
