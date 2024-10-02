const InstrumentOKXV1Model = require('../models/InstrumentOKXV1.model');
const OKX_API = require('../Trader/OKX/Doc/api');

const InstrumentOKXV1Controller = {

    getSymbolFromCloud: async () => {
        try {

            const list = []
            const getSpot = OKX_API.publicData.restAPI.getInstruments({ instType: "SPOT" })
            const getMargin = OKX_API.publicData.restAPI.getInstruments({ instType: "MARGIN" })

            const resultGetAll = await Promise.allSettled([getSpot, getMargin])

            resultGetAll.forEach((symbolListData) => {
                symbolListData.value?.forEach(e => {
                    if (e.quoteCcy == "USDT") {
                            list.push({
                                symbol: e.instId,
                                market: e.instType == "MARGIN" ? "Margin" : "Spot",
                                minSz: e.minSz,
                                lotSz: e.lotSz,
                                tickSz: e.tickSz
                            })
                    }
                })
            })
            return list

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
                        "market": data.market,
                    },
                    update: {
                        $set: {
                            minSz: data.minSz,
                            lotSz: data.lotSz,
                            tickSz: data.tickSz
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