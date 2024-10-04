const { RestClientV5 } = require('bybit-api');
const InstrumentsInfoModel = require('../../../../models/instruments/ByBit/V1/instrument.model')

const InstrumentsInfoController = {

    getSymbolFromCloud: async (userID) => {
        try {
            const clientDigit = new RestClientV5({
                testnet: false,
            });


            const list = []
            const responseDigit = await clientDigit.getInstrumentsInfo({
                category: 'spot',
            })

            responseDigit.result.list?.forEach((e) => {
                const symbol = e.symbol
                if (symbol.split("USDT")[1] === "") {
                    list.push({
                        symbol: e.symbol,
                        market:e.marginTrading != "none" ? "Margin" : "Spot",
                        minOrderQty: e.lotSizeFilter.minOrderQty,
                        basePrecision: e.lotSizeFilter.basePrecision,
                        tickSize: e.priceFilter.tickSize
                    })
                }
            })
            return list

        } catch (err) {
            return []
        }
    },
    getAll: async (req, res) => {
        try {
            const data = await InstrumentsInfoModel.find()

            res.customResponse(200, "Get All InstrumentsInfo Successful", data);

        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    },
    sync: async (req, res) => {
        try {
            const resData = await InstrumentsInfoController.getSymbolFromCloud()

            const bulkOperations = resData.map(data => ({
                updateOne: {
                    filter: {
                         "symbol": data.symbol, 
                         "market": data.market, 
                        },
                    update: {
                        $set: {
                            "minOrderQty": data.minOrderQty,
                            "basePrecision": data.basePrecision,
                            "market": data.market,
                            "tickSize": data.tickSize,
                        }
                    },
                    upsert:true
                }
            }));

            await InstrumentsInfoModel.bulkWrite(bulkOperations);

            res.customResponse(200, "Sync All Successful", "");

        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    },

}
module.exports = InstrumentsInfoController 