const { RestClientV5 } = require('bybit-api');
const CoinModel = require('../models/coin.model');

const CoinController = {

    getSymbolFromCloud: async (userID) => {
        try {

            let ListCoin1m = []

            let CoinInfo = new RestClientV5({
                testnet: false,
                recv_window: 100000
            });

            let data = []
            await CoinInfo.getTickers({ category: 'linear' })
                .then((rescoin) => {
                    rescoin.result.list.forEach((e) => {
                        if (e.symbol.indexOf("USDT") > 0) {
                            data.push({
                                symbol: e.symbol,
                                volume24h: e.turnover24h,
                            })
                        }
                    })
                })
                .catch((error) => {
                    console.error(error);
                });
            ListCoin1m = data.flatMap((coin) => {
                return `kline.1.${coin}`
            });

            return data

        } catch (err) {
            return []
        }
    },
    getAllCoin: async (req, res) => {
        try {
            const data = await CoinModel.find()

            res.customResponse(200, "Get All Coin Successful", data);

        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    },
    syncCoin: async (req, res) => {
        try {
            const resData = await CoinController.getSymbolFromCloud()
            const existingDocs = await CoinModel.find();

            const existingValues = existingDocs.reduce((pre, cur) => {
                const symbol = cur.symbol
                pre[symbol] = symbol
                return pre
            }, {});

            const bulkOperations = []
            resData.forEach(data => {
                const symbol = data.symbol
                bulkOperations.push({
                    updateOne: {
                        filter: { "symbol": symbol },
                        update: {
                            $set: {
                                "symbol": symbol,
                                "volume24h": data.volume24h
                            }
                        },
                        upsert: true
                    }
                });

                if (existingValues[symbol]) {
                    delete existingValues[symbol]
                }

            })
            const deleteList = Object.values(existingValues)

            const bulkOperationsDeletedRes = CoinModel.deleteMany({ symbol: { $in: deleteList } })
            const update = CoinModel.bulkWrite(bulkOperations);

            await Promise.allSettled([update, bulkOperationsDeletedRes])

            res.customResponse(200, "Sync All Coin Successful", "");

        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    },

}
module.exports = CoinController 