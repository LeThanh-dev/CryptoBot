const { RestClientV5 } = require('bybit-api');
const PositionModel = require('../../../../models/Positions/ByBit/V3/position.model')

const PositionController = {

    // OTHER 

    sendDataRealtime: ({
        type,
        data
    }) => {
        const { socketServer } = require('../serverConfig');
        socketServer.to("ByBitV3").emit(type, data)
    },
    // 
    getAllPosition: async (req, res) => {
        try {
            const { botListID } = req.body
            const data = await PositionModel.find({ botID: { $in: botListID } }).populate("botID")
            // const data = await BotApiModel.find({ botID })
            res.customResponse(res.statusCode, "Get All Position Successful", data);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    },

    // updatePL: async (req, res) => {
    //     try {
    //         const { botListID } = req.body

    //         if (botListID.length > 0) {

    //             await Promise.allSettled(botListID.map(dataBotItem => {
    //                 const client = new RestClientV5({
    //                     testnet: false,
    //                     key: dataBotItem.ApiKey,
    //                     secret: dataBotItem.SecretKey,
    //                     syncTimeBeforePrivateRequests: true,
    //                 });

    //                 return client.getPositionInfo({
    //                     category: 'linear',
    //                     settleCoin: "USDT"
    //                     // symbol: positionData.Symbol
    //                 }).then(async response => {

    //                     const dataPosition = await PositionModel.find({ botID: dataBotItem.value }).populate("botID")

    //                     const viTheList = response.result.list;

    //                     if (viTheList?.length > 0) {
    //                         if (viTheList.length >= dataPosition.length) {
    //                             return Promise.allSettled(viTheList?.map(viTheListItem => {
    //                                 const positionDataNew = {
    //                                     Pnl: viTheListItem.unrealisedPnl,
    //                                     Side: viTheListItem.side,
    //                                     Price: +viTheListItem.avgPrice,
    //                                     Symbol: viTheListItem.symbol,
    //                                     Quantity: viTheListItem.size
    //                                 };
    //                                 const checkPositionExist = dataPosition.find(positionItem => positionItem.Symbol === viTheListItem.symbol && dataBotItem.value == positionItem.botID._id);

    //                                 if (checkPositionExist) {
    //                                     // if (+positionDataNew.Quantity != 0) {
    //                                     positionDataNew.TimeUpdated = new Date()
    //                                     return PositionController.updatePositionBE({
    //                                         newDataUpdate: positionDataNew,
    //                                         orderID: checkPositionExist._id
    //                                     })
    //                                     // } 
    //                                     // else {
    //                                     //     return PositionController.deletePositionBE({
    //                                     //         orderID: checkPositionExist._id
    //                                     //     });
    //                                     // }
    //                                 }
    //                                 else {
    //                                     return PositionController.createPositionBE({
    //                                         ...positionDataNew,
    //                                         botID: dataBotItem.value,
    //                                         Miss: true
    //                                     });
    //                                 }
    //                             }))
    //                         }
    //                         else {
    //                             return Promise.allSettled(dataPosition?.map(positionItem => {

    //                                 const checkPositionExist = viTheList.find(item => item.symbol === positionItem.Symbol && positionItem.botID._id == dataBotItem.value)

    //                                 if (checkPositionExist) {
    //                                     const positionDataNew = {
    //                                         Pnl: checkPositionExist.unrealisedPnl,
    //                                         Side: checkPositionExist.side,
    //                                         Price: +checkPositionExist.avgPrice,
    //                                         Symbol: checkPositionExist.symbol,
    //                                         Quantity: checkPositionExist.size
    //                                     };
    //                                     // if (+positionDataNew.Quantity != 0) {
    //                                     positionDataNew.TimeUpdated = new Date()
    //                                     return PositionController.updatePositionBE({
    //                                         newDataUpdate: positionDataNew,
    //                                         orderID: positionItem._id
    //                                     })
    //                                     // } 
    //                                     // else {
    //                                     //     return PositionController.deletePositionBE({
    //                                     //         orderID: positionItem._id
    //                                     //     });
    //                                     // }
    //                                 }
    //                                 else {
    //                                     return PositionController.deletePositionBE({
    //                                         orderID: positionItem._id
    //                                     });

    //                                 }
    //                             }))
    //                         }
    //                     }
    //                     else {
    //                         return PositionModel.deleteMany({ botID: dataBotItem.value })
    //                     }
    //                 }).catch(error => {
    //                     console.log("Error", error);
    //                     return [];
    //                 });
    //             }));

    //             const newData = await PositionModel.find({ botID: { $in: botListID.map(item => item.value) } }).populate("botID")

    //             res.customResponse(200, "Refresh Position Successful", newData);
    //         }
    //         else {
    //             res.customResponse(200, "Refresh Position Successful", "");
    //         }

    //     } catch (err) {
    //         res.status(500).json({ message: err.message });
    //     }
    // },

    updatePL: async (req, res) => {
        try {
            const { botListID } = req.body

            if (botListID.length > 0) {
                let newData = []

                await Promise.allSettled(botListID.map(dataBotItem => {

                    const client = new RestClientV5({
                        testnet: false,
                        key: dataBotItem.ApiKey,
                        secret: dataBotItem.SecretKey,
                        syncTimeBeforePrivateRequests: true,
                    });

                    const botID = dataBotItem.value

                    return client.getPositionInfo({
                        category: 'linear',
                        settleCoin: "USDT"
                        // symbol: positionData.Symbol
                    }).then(async response => {


                        const viTheList = response.result.list;

                        if (viTheList?.length > 0) {
                            const dataPosition = await PositionModel.find({ botID: botID }).populate("botID")

                            const dataPositionObject = dataPosition.reduce((pre, cur) => {
                                pre[`${botID}-${cur.Symbol}`] = cur
                                return pre
                            }, {})

                            const dataAll = await Promise.allSettled((viTheList.map(async viTheListItem => {

                                const Symbol = viTheListItem.symbol
                                const positionID = `${botID}-${Symbol}`
                                const positionData = dataPositionObject[positionID]

                                let data = {
                                    Pnl: viTheListItem.unrealisedPnl,
                                    Side: viTheListItem.side,
                                    Price: +viTheListItem.avgPrice,
                                    Symbol,
                                    Quantity: viTheListItem.size,

                                    botID,
                                    botName: dataBotItem?.name,
                                    botData: dataBotItem
                                }
                                if (positionData?._id) {
                                    data = {
                                        ...data,
                                        _id: positionData?._id,
                                        Time: positionData?.Time,
                                        TimeUpdated: new Date(),
                                        Miss: positionData.Miss,
                                    }
                                    delete dataPositionObject[positionID]
                                }
                                else {
                                    data = {
                                        ...data,
                                        Time: new Date(),
                                        TimeUpdated: new Date(),
                                        Miss: true,
                                    }
                                    const resNew = await PositionController.createPositionBE(data)
                                    data = {
                                        ...data,
                                        _id: resNew?.id || positionID,
                                    }

                                }
                                return data
                            })))

                            newData = newData.concat(dataAll.map(data => data.value))

                            const positionOld = Object.values(dataPositionObject)

                            positionOld.length > 0 && await PositionModel.deleteMany({ _id: { $in: positionOld.map(item => item._id) } })
                        }
                        else {
                            return await PositionModel.deleteMany({ botID: botID })
                        }



                    }).catch(error => {
                        console.log("Error", error);
                        return [];
                    });
                }));

                res.customResponse(200, "Refresh Position V3 Successful", newData);
            }
            else {
                res.customResponse(200, "Refresh Position V3 Successful", "");
            }

        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    },

    closeAllPosition: async (req, res) => {
        try {
            const { botListID } = req.body

            let allViThe = {}
            let botListData = []

            await Promise.allSettled(botListID.map(dataBotItem => {

                const client = new RestClientV5({
                    testnet: false,
                    key: dataBotItem.ApiKey,
                    secret: dataBotItem.SecretKey,
                    syncTimeBeforePrivateRequests: true,
                });

                const botID = dataBotItem.value

                return client.getPositionInfo({
                    category: 'linear',
                    settleCoin: "USDT"
                    // symbol: positionData.Symbol
                }).then(async response => {

                    const viTheList = response.result.list;
                    let listOC = []
                    let symbolList = []

                    viTheList.forEach(viTheListItem => {
                        const symbol = viTheListItem.symbol
                        listOC.push({
                            side: viTheListItem.side === "Buy" ? "Sell" : "Buy",
                            symbol,
                            qty: viTheListItem.size,
                            orderType: "Market",
                            positionIdx: 0,
                        })
                        symbolList.push(symbol)
                    })

                    allViThe[botID] = {
                        ApiKey: dataBotItem.ApiKey,
                        SecretKey: dataBotItem.SecretKey,
                        listOC
                    }
                    botListData.push({
                        botID,
                        symbolList
                    })
                })
            }))
            PositionController.sendDataRealtime({
                type: "closeAllPosition",
                data: botListData
            })
            await PositionController.handleCancelAllPosition(
                Object.values(allViThe))

            res.customResponse(200, "Close All Position Successful", "");

        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    },
    handleCancelAllPosition: async (items = [], batchSize = 10) => {

        if (items.length > 0) {
            await Promise.allSettled(items.map(async item => {
                const client = new RestClientV5({
                    testnet: false,
                    key: item.ApiKey,
                    secret: item.SecretKey,
                    syncTimeBeforePrivateRequests: true,

                });
                const list = Object.values(item.listOC || {})

                if (list.length > 0) {
                    console.log(`[...] Total Position Can Be Cancelled: ${list.length}`);
                    let index = 0;
                    while (index < list.length) {
                        const batch = list.slice(index, index + batchSize);

                        const res = await client.batchSubmitOrders("linear", batch)

                        await delay(1000)
                        index += batchSize
                    }
                }
            }))
            console.log("[V] Cancel All Position Successful");
        }
    },

    getPriceLimitCurrent: async (req, res) => {
        try {
            const { symbol } = req.body

            const client = new RestClientV5({
                testnet: false,
            });

            await client.getKline({
                category: 'linear',
                symbol,
                interval: '1',
            }).then(response => {
                const priceCurrent = response.result.list[0]?.[4]
                res.customResponse(200, "Get Price Current Successful", priceCurrent);
            }).catch(err => {
                res.customResponse(400, "Get Price Current Failed", "");
            })

        } catch (error) {
            res.customResponse(500, "Get Price Current Error", "");
        }
    },

    closeMarket: async (req, res) => {

        const { positionData, Quantity } = req.body

        const client = new RestClientV5({
            testnet: false,
            key: positionData.botData.ApiKey,
            secret: positionData.botData.SecretKey,
            syncTimeBeforePrivateRequests: true,
        });
        client
            .submitOrder({
                category: 'linear',
                symbol: positionData.Symbol,
                side: positionData.Side === "Sell" ? "Buy" : "Sell",
                positionIdx: 0,
                orderType: 'Market',
                qty: Quantity,
                // price: Math.abs(positionData.Price).toString(),
            })
            .then((response) => {

                if (response.retCode == 0) {
                    res.customResponse(200, "Close Market Successful");
                    PositionController.deletePositionBE({
                        orderID: positionData.id
                    }).then(message => {
                        console.log(message);
                    }).catch(err => {
                        console.log(err);
                    })
                }
                else {
                    res.customResponse(400, response.retMsg);
                }
            })
            .catch((error) => {
                res.customResponse(500, "Close Market Error");
            });
    },

    closeLimit: async (req, res) => {
        const { positionData, Quantity, Price } = req.body

        const symbol = positionData.Symbol
        const client = new RestClientV5({
            testnet: false,
            key: positionData.botData.ApiKey,
            secret: positionData.botData.SecretKey,
            syncTimeBeforePrivateRequests: true,
        });
        const side = positionData.Side === "Sell" ? "Buy" : "Sell"
        client
            .submitOrder({
                category: 'linear',
                symbol,
                side,
                positionIdx: 0,
                orderType: 'Limit',
                qty: Quantity,
                price: Price,
                reduceOnly: true
            })
            .then(async (response) => {

                if (response.retCode == 0) {

                    const result = await PositionModel.updateOne({ Symbol: symbol, botID: positionData.botID }, {
                        $set: {
                            Miss: false,
                            TimeUpdated: new Date()
                        }
                    });

                    if (result.acknowledged && result.matchedCount !== 0) {
                        console.log(`[Mongo-Limit] Update Position ( ${positionData.BotName} ) Successful`)
                    }
                    else {
                        console.log(`[Mongo-Limit] Update Position ( ${positionData.BotName} ) Failed`)
                    }

                    // PositionController.sendDataRealtime({
                    //     type: "close-limit",
                    //     data: {
                    //         positionData,
                    //         newOrderID: response.result.orderId
                    //     }
                    // })
                    res.customResponse(200, "Close Limit Successful");

                }
                else {
                    if (response.retCode == 110017) {
                        const text = side === "Sell" ? "cao hơn" : "thấp hơn"
                        res.customResponse(400, `Giá TP không được ${text} giá TP hiện tại`);
                    }
                    else {
                        res.customResponse(400, response.retMsg);
                    }
                }
            })
            .catch((error) => {
                res.customResponse(500, `Close Limit Error: ${error}`);
            });

    },

    // OTHER

    getPositionBySymbol: async ({ symbol, botID }) => {
        try {
            const data = await PositionModel.findOne({
                Symbol: symbol,
                botID: botID
            })

            if (data) {
                return {
                    message: "[Mongo] Re-Get Position Successful",
                    id: data._id
                }
            }
            else {
                return {
                    message: "[Mongo] Re-Get Position Failed",
                    id: ""
                }
            }
        } catch (error) {
            return {
                message: `[Mongo] Re-Get Position Error: ${error}`,
                id: ""
            }

        }
    },

    createPositionBE: async (newData) => {
        try {

            const newBot = new PositionModel({
                ...newData,
                Time: new Date(),
                TimeUpdated: new Date()
            });

            const savedBot = await newBot.save();

            if (savedBot) {
                return {
                    message: "[Mongo] Add Position Successful",
                    id: savedBot._id
                }
            }
            else {
                return {
                    message: "[Mongo] Add Position Failed",
                    id: ""
                }
            }

        } catch (error) {
            return {
                message: `[Mongo] Add Position Error: ${error}`,
                id: ""
            }
        }
    },

    updatePositionBE: async ({
        newDataUpdate,
        orderID
    }) => {
        try {

            const result = await PositionModel.updateOne({ _id: orderID }, {
                $set: newDataUpdate
            });

            if (result.acknowledged && result.matchedCount !== 0) {
                return "[Mongo] Update Position Successful"
            }
            else {
                return `[Mongo] Update Position Failed`
            }

        } catch (error) {
            return `[Mongo] Update Position Error: ${error}`
        }
    },

    deletePositionBE: async ({ orderID }) => {
        try {

            const result = await PositionModel.deleteOne({ _id: orderID })

            if (result.deletedCount && result.deletedCount !== 0) {
                return "[Mongo] Delete Position Successful"
            }
            else {
                return `[Mongo] Delete Position Failed ${orderID}`
            }

        } catch (error) {
            return `[Mongo] Delete Position Error ${error}`
        }
    },


}

module.exports = PositionController 