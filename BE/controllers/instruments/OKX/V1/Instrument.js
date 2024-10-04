const InstrumentOKXV1Model = require('../../../../models/instruments/OKX/V1/instrument.model')
const OKX_API = require('../../../../Trader/OKX/Doc/api')


const InstrumentOKXV1Controller = {

    getSymbolFromCloud: async () => {
        try {

            const list = {}
            const getSpot = OKX_API.publicData.restAPI.getInstruments({ instType: "SPOT" })
            const getMargin = OKX_API.publicData.restAPI.getInstruments({ instType: "MARGIN" })

            const resultGetAll = await Promise.allSettled([getSpot, getMargin])
            const getTickers = await OKX_API.orderBookTrading.marketData.getTickers({ instType: "SPOT" })

            const vol24hBySymbolObject = {}

            getTickers.forEach((ticker) => {
                const symbol = ticker.instId
                if (symbol.includes("USDT")) {
                    vol24hBySymbolObject[symbol] = ticker.volCcy24h
                }
            })

            resultGetAll.forEach((symbolListData) => {
                symbolListData.value?.forEach(e => {
                    if (e.quoteCcy == "USDT") {
                        const symbol = e.instId
                        const market = e.instType == "MARGIN" ? "Margin" : "Spot"
                        const volume24h = vol24hBySymbolObject[symbol]
                        if (!list[symbol]) {
                            list[symbol] = {
                                symbol,
                                market,
                                minSz: e.minSz,
                                lotSz: e.lotSz,
                                tickSz: e.tickSz,
                                lever: e.lever,
                                volume24h
                            }
                        }
                        else {
                            market === "Margin" && (list[symbol].market = market);
                        }
                    }
                })
            })
            return Object.values(list)
        } catch (err) {
            return []
        }
    },
    getAll: async (req, res) => {
        try {
            const data = await InstrumentOKXV1Model.find()

            res.customResponse(200, "Get All Instrument Info Successful", data);

        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    },
    sync: async (req, res) => {
        try {
            const resData = await InstrumentOKXV1Controller.getSymbolFromCloud()

            const bulkOperations = resData.map(data => ({
                updateOne: {
                    filter: {
                        "symbol": data.symbol,
                        // "market": data.market,
                    },
                    update: {
                        $set: {
                            minSz: data.minSz,
                            lotSz: data.lotSz,
                            tickSz: data.tickSz,
                            lever: data.lever,
                            vol: data.volume24h,
                        }
                    },
                    upsert: true
                }
            }));

            await InstrumentOKXV1Model.bulkWrite(bulkOperations);

            res.customResponse(200, "Sync All Successful", resData);

        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    },

}
module.exports = InstrumentOKXV1Controller 