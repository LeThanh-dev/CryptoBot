const { RestClientV5, WebsocketClient } = require('bybit-api');
const ScannerModel = require('../../../../models/Configs/OKX/V1/scanner.model')
const SpotModel = require('../../../../models/Configs/OKX/V1/spot.model');
const MarginModel = require('../../../../models/Configs/OKX/V1/margin.model');
// const PositionV1Model = require('../../../../models/Positions/OKX/V1/position.model');
const BotModel = require('../../../../models/bot.model')
const { v4: uuidv4 } = require('uuid');
const { default: mongoose } = require('mongoose');

const dataCoinByBitController = {
    // SOCKET

    sendDataRealtime: ({
        type,
        data
    }) => {
        const { socketServer } = require('../../../../serverConfig');
        socketServer.to("ByBitV1").emit(type, data)
    },
    closeAllBotForUpCode: async (req, res) => {
        dataCoinByBitController.sendDataRealtime({
            type: "close-upcode"
        })
        res.customResponse(200, "Send Successful", "");
    },
    getSymbolFromCloud: async (userID) => {
        try {

            let ListCoin1m = []

            let wsConfig = {
                market: 'v5',
                recvWindow: 100000
            }
            let wsInfo = {
                testnet: false,
            }
            let wsSymbol = new WebsocketClient(wsConfig);
            let CoinInfo = new RestClientV5(wsInfo);

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
    syncSymbolScanner: async (req, res) => {
        try {
            const userID = req.user._id

            const listSymbolObject = await dataCoinByBitController.getSymbolFromCloud(userID);

            if (listSymbolObject?.length) {


                const existingDocs = await ScannerModel.find({ value: { $in: listSymbolObject.map(item => item.symbol) } });

                const existingValues = existingDocs.map(doc => doc.value);

                const valuesToAdd = listSymbolObject.filter(value => !existingValues.includes(value.symbol));

                const newSymbolList = []
                const newSymbolNameList = []

                valuesToAdd.forEach(value => {
                    newSymbolList.push({
                        label: value.symbol,
                        value: value.symbol,
                        volume24h: value.volume24h,
                        children: []
                    });
                    newSymbolNameList.push(value.symbol);
                })

                const insertSymbolNew = ScannerModel.insertMany(newSymbolList)

                const bulkOperations = listSymbolObject.map(data => ({
                    updateOne: {
                        filter: { "label": data.symbol },
                        update: {
                            $set: {
                                "volume24h": data.volume24h
                            }
                        }
                    }
                }));

                const insertVol24 = ScannerModel.bulkWrite(bulkOperations);

                await Promise.allSettled([insertSymbolNew, insertVol24])

                if (newSymbolList.length > 0) {

                    const newSymbolResult = await ScannerModel.find({
                        value: { $in: newSymbolNameList }
                    }).select("value")

                    dataCoinByBitController.sendDataRealtime({
                        type: "sync-symbol",
                        data: newSymbolResult
                    })
                    res.customResponse(200, "Have New Sync Successful", newSymbolList)

                }
                else {
                    res.customResponse(200, "Sync Successful", [])
                }
            }
            else {
                res.customResponse(400, "Sync Failed", []);

            }

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    getAllConfigScanner: async (req, res) => {
        try {
            const userID = req.user._id

            const { botListInput } = req.body

            const botList = botListInput.map(item => new mongoose.Types.ObjectId(item));

            const resultFilter = await ScannerModel.aggregate([
                {
                    $match: {
                        "botID": { $in: botList }
                    }
                },
                {
                    $addFields: {
                        hasUserID: {
                            $cond: {
                                if: { $in: [userID, { $ifNull: ["$bookmarkList", []] }] },
                                then: 1,
                                else: 0
                            }
                        }
                    }
                },
                {
                    $sort: {
                        hasUserID: -1,
                    }
                },
            ]);


            const handleResult = await ScannerModel.populate(resultFilter, {
                path: 'botID',
            })

            res.customResponse(200, "Get All Config Successful", handleResult);

        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    },

    // CREATE
    createConfigScanner: async (req, res) => {

        try {
            const userID = req.user._id

            const { data: newData, botListId, Blacklist, OnlyPairs } = req.body

            let result

            const TimeTemp = new Date().toString()

            if (newData.PositionSide === "Both") {
                result = await ScannerModel.insertMany(
                    [
                        ...botListId.map(botID => ({ ...newData, PositionSide: "Long", botID, userID, TimeTemp, Blacklist, OnlyPairs })),
                        ...botListId.map(botID => ({ ...newData, PositionSide: "Short", botID, userID, TimeTemp, Blacklist, OnlyPairs }))
                    ]
                )
            }
            else {
                result = await ScannerModel.insertMany(
                    botListId.map(botID => ({ ...newData, botID, userID, TimeTemp, Blacklist, OnlyPairs }))
                );
            }

            const handleResult = await ScannerModel.find({
                IsActive: true,
                userID,
                TimeTemp
            }).populate('botID')

            if (result) {

                handleResult.length > 0 && dataCoinByBitController.sendDataRealtime({
                    type: "scanner-add",
                    data: handleResult
                })

                res.customResponse(200, "Add New Config Successful", []);
            }
            else {
                res.customResponse(400, "Add New Config Failed", "");
            }
        }

        catch (error) {
            res.status(500).json({ message: error.message });
        }

    },

    // UPDATE

    updateConfigByID: async (req, res) => {
        try {

            const { newData, configID } = req.body

            const bulkOperationsRes = ScannerModel.updateOne(
                { _id: configID },
                { $set: newData }
            )
            const configIDBE = new mongoose.Types.ObjectId(configID)

            const resultFilterSpot = await SpotModel.aggregate([
                {
                    $match: {
                        "children.scannerID": { $in: [configIDBE] }
                    }
                },
                {
                    $project: {
                        label: 1,
                        value: 1,
                        volume24h: 1,
                        children: {
                            $filter: {
                                input: "$children",
                                as: "child",
                                cond: {
                                    $in: ["$$child.scannerID", [configIDBE]]
                                }
                            }
                        }
                    }
                }
            ]);

            const resultGetSpot = await SpotModel.populate(resultFilterSpot, {
                path: 'children.botID',
            }) || []


            const handleResultSpot = resultGetSpot.flatMap((data) => data.children.map(child => {
                child.symbol = data.value
                child.value = `SPOT-${data._id}-${child._id}`
                return child
            })) || []

            const resultFilterMargin = await MarginModel.aggregate([
                {
                    $match: {
                        "children.scannerID": { $in: [configIDBE] }
                    }
                },
                {
                    $project: {
                        label: 1,
                        value: 1,
                        volume24h: 1,
                        children: {
                            $filter: {
                                input: "$children",
                                as: "child",
                                cond: {
                                    $in: ["$$child.scannerID", [configIDBE]]
                                }
                            }
                        }
                    }
                }
            ]);

            const resultGetMargin = await MarginModel.populate(resultFilterMargin, {
                path: 'children.botID',
            }) || []

            const handleResultMargin = resultGetMargin.flatMap((data) => data.children.map(child => {
                child.symbol = data.value
                child.value = `MARGIN-${data._id}-${child._id}`
                return child
            })) || []


            const handleResultDelete = handleResultMargin.concat(handleResultSpot)

            const bulkOperationsDelSpotRes = SpotModel.updateMany(
                { "children.scannerID": { $in: [configIDBE] } },
                { $pull: { children: { scannerID: { $in: [configIDBE] } } } }
            );


            const bulkOperationsDelMarginRes = MarginModel.updateMany(
                { "children.scannerID": { $in: [configIDBE] } },
                { $pull: { children: { scannerID: { $in: [configIDBE] } } } }
            );


            await Promise.allSettled([bulkOperationsRes, bulkOperationsDelSpotRes, bulkOperationsDelMarginRes])

            handleResultDelete.length > 0 && dataCoinByBitController.sendDataRealtime({
                type: "delete",
                data: handleResultDelete
            })

            dataCoinByBitController.sendDataRealtime({
                type: "scanner-update",
                data: [newData]
            })
            res.customResponse(200, "Update Config Successful", "");



        } catch (error) {
            // Xử lý lỗi nếu có
            res.status(500).json({ message: "Update Config Error" });
        }
    },

    updateStrategiesMultipleScanner: async (req, res) => {
        try {

            const dataList = req.body

            const TimeTemp = new Date().toString()

            const bulkOperations = []
            const spotDeleteID = []
            const marginDeleteID = []

            dataList.forEach((data) => {
                bulkOperations.push({
                    updateOne: {
                        filter: { _id: data.id },
                        update: {
                            $set: {
                                ...data.UpdatedFields,
                                TimeTemp
                            }
                        }
                    }
                })
                const id = new mongoose.Types.ObjectId(data.id)
                data.UpdatedFields.Market === "Spot" ? spotDeleteID.push(id) : marginDeleteID.push(id)
            });

            // handle get all config by scannerID

            const resultFilterSpot = await SpotModel.aggregate([
                {
                    $match: {
                        "children.scannerID": { $in: spotDeleteID }
                    }
                },
                {
                    $project: {
                        label: 1,
                        value: 1,
                        volume24h: 1,
                        children: {
                            $filter: {
                                input: "$children",
                                as: "child",
                                cond: {
                                    $in: ["$$child.scannerID", spotDeleteID]
                                }
                            }
                        }
                    }
                }
            ]);

            const resultGetSpot = await SpotModel.populate(resultFilterSpot, {
                path: 'children.botID',
            }) || []


            const handleResultSpot = resultGetSpot.flatMap((data) => data.children.map(child => {
                child.symbol = data.value
                child.value = `SPOT-${data._id}-${child._id}`
                return child
            })) || []

            const resultFilterMargin = await MarginModel.aggregate([
                {
                    $match: {
                        "children.scannerID": { $in: marginDeleteID }
                    }
                },
                {
                    $project: {
                        label: 1,
                        value: 1,
                        volume24h: 1,
                        children: {
                            $filter: {
                                input: "$children",
                                as: "child",
                                cond: {
                                    $in: ["$$child.scannerID", marginDeleteID]
                                }
                            }
                        }
                    }
                }
            ]);

            const resultGetMargin = await MarginModel.populate(resultFilterMargin, {
                path: 'children.botID',
            }) || []

            const handleResultMargin = resultGetMargin.flatMap((data) => data.children.map(child => {
                child.symbol = data.value
                child.value = `MARGIN-${data._id}-${child._id}`
                return child
            })) || []


            const handleResultDelete = handleResultMargin.concat(handleResultSpot)


            // ----------------------------------------------------------------

            const bulkOperationsRes = ScannerModel.bulkWrite(bulkOperations);

            const bulkOperationsDelSpotRes = SpotModel.updateMany(
                { "children.scannerID": { $in: spotDeleteID } },
                { $pull: { children: { scannerID: { $in: spotDeleteID } } } }
            );


            const bulkOperationsDelMarginRes = MarginModel.updateMany(
                { "children.scannerID": { $in: marginDeleteID } },
                { $pull: { children: { scannerID: { $in: marginDeleteID } } } }
            );


            await Promise.allSettled([bulkOperationsRes, bulkOperationsDelSpotRes, bulkOperationsDelMarginRes])

            const handleResult = await ScannerModel.find({
                TimeTemp
            }).populate('botID')

            handleResultDelete.length > 0 && dataCoinByBitController.sendDataRealtime({
                type: "delete",
                data: handleResultDelete
            })

            handleResult.length > 0 && dataCoinByBitController.sendDataRealtime({
                type: "scanner-update",
                data: handleResult
            })

            res.customResponse(200, "Update Config Successful", "");

        } catch (error) {
            // Xử lý lỗi nếu có
            res.status(500).json({ message: "Update Config Error" + error.message });
        }
    },

    handleBookmarkScanner: async (req, res) => {
        try {

            const { configID, IsBookmark } = req.body

            const text = IsBookmark ? "Add" : "Remove"
            const result = await ScannerModel.updateOne(
                { "_id": configID },
                { IsBookmark }
            )

            if (result.acknowledged && result.matchedCount !== 0) {
                res.customResponse(200, `${text} Bookmark Successful`, "");
            }
            else {
                res.customResponse(400, `${text} Bookmark Failed`, "");
            }

        } catch (error) {
            // Xử lý lỗi nếu có
            res.status(500).json({ message: `${text} Bookmark Error` });
        }
    },

    // DELETE

    deleteStrategiesByIDScanner: async (req, res) => {
        try {

            const { configID } = req.body

            const result = await ScannerModel.findOneAndDelete(
                {
                    "_id": configID
                }
            )

            if (result) {

                dataCoinByBitController.sendDataRealtime({
                    type: "scanner-delete",
                    data: [result]
                })

                res.customResponse(200, "Delete Config Successful");
            }
            else {
                res.customResponse(400, `Delete Config Failed `);
            }

        } catch (error) {
            res.status(500).json({ message: "Delete Config Error" });
        }
    },

    deleteStrategiesMultipleScanner: async (req, res) => {
        try {

            const strategiesIDList = req.body

            const listScanner = []
            const spotDeleteID = []
            const marginDeleteID = []

            strategiesIDList.forEach(item => {
                const id = new mongoose.Types.ObjectId(item.id)
                listScanner.push(id)
                item.Market == "Spot" ? spotDeleteID.push(id) : marginDeleteID.push(id)
            })


            const resultBeforeDelete = await ScannerModel.find(
                {
                    "_id": { $in: listScanner }
                }
            )

            const resultFilterSpot = await SpotModel.aggregate([
                {
                    $match: {
                        "children.scannerID": { $in: spotDeleteID }
                    }
                },
                {
                    $project: {
                        label: 1,
                        value: 1,
                        volume24h: 1,
                        children: {
                            $filter: {
                                input: "$children",
                                as: "child",
                                cond: {
                                    $in: ["$$child.scannerID", spotDeleteID]
                                }
                            }
                        }
                    }
                }
            ]);

            const resultGetSpot = await SpotModel.populate(resultFilterSpot, {
                path: 'children.botID',
            }) || []


            const handleResultSpot = resultGetSpot.flatMap((data) => data.children.map(child => {
                child.symbol = data.value
                child.value = `SPOT-${data._id}-${child._id}`
                return child
            })) || []


            const resultFilterMargin = await MarginModel.aggregate([
                {
                    $match: {
                        "children.scannerID": { $in: marginDeleteID }
                    }
                },
                {
                    $project: {
                        label: 1,
                        value: 1,
                        volume24h: 1,
                        children: {
                            $filter: {
                                input: "$children",
                                as: "child",
                                cond: {
                                    $in: ["$$child.scannerID", marginDeleteID]
                                }
                            }
                        }
                    }
                }
            ]);

            const resultGetMargin = await MarginModel.populate(resultFilterMargin, {
                path: 'children.botID',
            }) || []

            const handleResultMargin = resultGetMargin.flatMap((data) => data.children.map(child => {
                child.symbol = data.value
                child.value = `MARGIN-${data._id}-${child._id}`
                return child
            })) || []


            const handleResultDelete = handleResultMargin.concat(handleResultSpot)


            const bulkOperationsRes = ScannerModel.deleteMany(
                {
                    "_id": { $in: listScanner }
                }
            )

            const bulkOperationsDelSpotRes = SpotModel.updateMany(
                { "children.scannerID": { $in: spotDeleteID } },
                { $pull: { children: { scannerID: { $in: spotDeleteID } } } }
            );


            const bulkOperationsDelMarginRes = MarginModel.updateMany(
                { "children.scannerID": { $in: marginDeleteID } },
                { $pull: { children: { scannerID: { $in: marginDeleteID } } } }
            );

            // if (result.acknowledged && result.deletedCount !== 0) {

            await Promise.allSettled([bulkOperationsRes, bulkOperationsDelSpotRes, bulkOperationsDelMarginRes])

            handleResultDelete.length > 0 && dataCoinByBitController.sendDataRealtime({
                type: "delete",
                data: handleResultDelete
            })

            dataCoinByBitController.sendDataRealtime({
                type: "scanner-delete",
                data: resultBeforeDelete
            })
            res.customResponse(200, "Delete Config Successful");


        } catch (error) {
            res.status(500).json({ message: "Delete Config Error" });
        }
    },

    // OTHER

    copyMultipleStrategiesToSymbolSpot: async (req, res) => {

        try {
            const { symbolListData, symbolList } = req.body

            const TimeTemp = new Date().toString()

            // const bulkOperations = [];

            // // Lặp qua danh sách symbolList và tạo các thao tác push vào mảng bulkOperations
            // symbolList.forEach(symbol => {
            //     const filter = { "value": symbol };
            //     const update = {
            //         $push: {
            //             "children": {
            //                 $each: symbolListData.map(data => {
            //                     const newObj = { ...data, TimeTemp };
            //                     delete newObj?._id
            //                     delete newObj?.value
            //                     return newObj

            //                 })
            //             }
            //         }
            //     };

            //     bulkOperations.push({
            //         updateOne: {
            //             filter,
            //             update
            //         }
            //     });
            // });

            const bulkOperations = symbolList.map(symbol => ({
                updateOne: {
                    filter: { "value": symbol },
                    update: {
                        $push: {
                            "children": {
                                $each: symbolListData.map(({ _id, value, ...rest }) => ({ ...rest, TimeTemp }))
                            }
                        }
                    }
                }
            }));

            const bulkResult = await ScannerModel.bulkWrite(bulkOperations);


            if (bulkResult.modifiedCount === symbolList.length) {


                const newDataSocketWithBotData = await dataCoinByBitController.getAllStrategiesNewUpdate(TimeTemp)

                newDataSocketWithBotData.length > 0 && dataCoinByBitController.sendDataRealtime({
                    type: "update",
                    data: newDataSocketWithBotData
                })
                res.customResponse(200, "Copy Strategies To Symbol Successful", []);

            }
            else {
                res.customResponse(400, "Copy Strategies To Symbol Failed", "");
            }


        }

        catch (error) {
            res.status(500).json({ message: error.message });
        }

    },

    copyMultipleStrategiesToBotScanner: async (req, res) => {

        try {
            const { symbolListData, symbolList } = req.body

            const TimeTemp = new Date().toString();

            const result = await ScannerModel.insertMany(symbolList.flatMap(botID => {
                return symbolListData.map(({ _id, ...data }) => {
                    return {
                        ...data,
                        TimeTemp,
                        botID
                    }
                })
            }))


            if (result) {
                const handleResult = await ScannerModel.find({
                    TimeTemp
                }).populate('botID')

                handleResult.length > 0 && dataCoinByBitController.sendDataRealtime({
                    type: "scanner-add",
                    data: handleResult
                })

                res.customResponse(200, "Copy Config To Bot Successful", "");

            }
            else {
                res.customResponse(400, "Copy Config To Bot Failed", "");
            }



        }

        catch (error) {
            res.status(500).json({ message: error.message });
        }

    },



    transferFunds: async (amount, FromWallet, ToWallet) => {

        const client = new RestClientV5({
            testnet: false,
            key: API_KEY,
            secret: SECRET_KEY,
            syncTimeBeforePrivateRequests: true,
        });

        let myUUID = uuidv4();
        client.createInternalTransfer(
            myUUID,
            'USDT',
            amount,
            FromWallet,
            ToWallet,
        )
            .then((response) => {
                console.log(response);
            })
            .catch((error) => {
                console.error(error);
            });
    },


    balanceWallet: async (req, res) => {

        try {
            // FUND: Spot
            // UNIFIED: Future
            const { amount, futureLarger, botID } = req.body

            const resultApiKey = await dataCoinByBitController.getApiKeyByBot(botID)

            if (resultApiKey) {

                let FromWallet = "FUND"
                let ToWallet = "UNIFIED"

                if (futureLarger) {
                    FromWallet = "UNIFIED"
                    ToWallet = "FUND"
                }

                const client = new RestClientV5({
                    testnet: false,
                    key: resultApiKey.API_KEY,
                    secret: resultApiKey.SECRET_KEY,
                    syncTimeBeforePrivateRequests: true,

                });

                let myUUID = uuidv4();

                // console.log(myUUID, FromWallet, ToWallet, amount, futureLarger);
                client.createInternalTransfer(
                    myUUID,
                    'USDT',
                    amount.toFixed(4),
                    FromWallet,
                    ToWallet,
                )
                    .then((response) => {
                        const status = response.result.status == "SUCCESS"
                        status ? res.customResponse(200, "Saving Successful", "") : res.customResponse(500, "Saving Error", "")

                    })
                    .catch((error) => {
                        res.customResponse(500, "Saving Error", "");
                    });
            }
            else {
                res.customResponse(500, "Saving Error", "");
            }

        }
        catch (error) {
            res.customResponse(500, "Saving Error", "");
        }
    },

    getApiKeyByBot: async (botID) => {

        const resultApi = await BotModel.findOne({ _id: botID })

        if (!resultApi) {
            return ""
        }

        return {
            API_KEY: resultApi.ApiKey,
            SECRET_KEY: resultApi.SecretKey
        }
    },

    getFutureAvailable: async (req, res) => {

        try {
            const botID = req.params.id

            const resultApiKey = await dataCoinByBitController.getApiKeyByBot(botID)

            if (resultApiKey) {
                const client = new RestClientV5({
                    testnet: false,
                    key: resultApiKey.API_KEY,
                    secret: resultApiKey.SECRET_KEY,
                    syncTimeBeforePrivateRequests: true,

                });

                // get field totalWalletBalance
                await client.getWalletBalance({
                    accountType: 'UNIFIED',
                    coin: 'USDT',
                }).then((result) => {
                    res.customResponse(200, "Get Future Available Successful", result);
                })
                    .catch((error) => {
                        res.customResponse(400, error.message, "");
                    });
            }
            else {
                res.customResponse(400, "Get Future Available Failed", "");
            }

        } catch (error) {
            res.customResponse(500, "Get Future Available Error", "");

        }

    },

    getSpotTotal: async (req, res) => {

        try {
            const botID = req.params.id

            const resultApiKey = await dataCoinByBitController.getApiKeyByBot(botID)

            if (resultApiKey) {
                const client = new RestClientV5({
                    testnet: false,
                    key: resultApiKey.API_KEY,
                    secret: resultApiKey.SECRET_KEY,
                    syncTimeBeforePrivateRequests: true,

                });

                await client.getAllCoinsBalance({
                    accountType: 'FUND',
                    coin: 'USDT'
                }).then((result) => {
                    res.customResponse(200, "Get Spot Total Successful", result);
                })
                    .catch((error) => {
                        res.customResponse(400, error.message, "");
                    });
            }
            else {
                res.customResponse(400, "Get Spot Total Failed", "");
            }

        } catch (error) {
            res.customResponse(500, "Get Spot Total Error", "");

        }

    },

    // OTHER

    getFutureSpotBE: async (botID) => {

        try {

            const resultApiKey = await dataCoinByBitController.getApiKeyByBot(botID)

            if (resultApiKey) {
                const API_KEY = resultApiKey.API_KEY;
                const SECRET_KEY = resultApiKey.SECRET_KEY;

                const client = new RestClientV5({
                    testnet: false,
                    key: API_KEY,
                    secret: SECRET_KEY,
                    syncTimeBeforePrivateRequests: true,

                });

                // get field totalWalletBalance
                const getFuture = client.getWalletBalance({
                    accountType: 'UNIFIED',
                    coin: 'USDT',
                })
                const getSpot = client.getAllCoinsBalance({
                    accountType: 'FUND',
                    coin: 'USDT'
                })
                const result = await Promise.all([getFuture, getSpot])

                if (result.every(item => item.retCode === 0)) {
                    return {
                        future: result[0]?.result?.list?.[0]?.coin[0].walletBalance || 0,
                        spotTotal: result[1]?.result?.balance?.[0]?.walletBalance || 0,
                        API_KEY,
                        SECRET_KEY
                    }
                }
                return {}
            }
            else {
                return {}
            }

        } catch (error) {
            return {}

        }
    },

    getFutureBE: async (botID) => {

        try {

            const resultApiKey = await dataCoinByBitController.getApiKeyByBot(botID)

            if (resultApiKey) {
                const API_KEY = resultApiKey.API_KEY;
                const SECRET_KEY = resultApiKey.SECRET_KEY;

                const client = new RestClientV5({
                    testnet: false,
                    key: API_KEY,
                    secret: SECRET_KEY,
                    syncTimeBeforePrivateRequests: true,

                });

                // get field totalWalletBalance
                const result = await client.getWalletBalance({
                    accountType: 'UNIFIED',
                    coin: 'USDT',
                })

                if (result.retCode === 0) {
                    return {
                        totalWalletBalance: result.result?.list?.[0]?.coin[0].walletBalance || 0,
                        botID
                    }
                }
                return {
                    totalWalletBalance: 0,
                    botID
                }

            }
        } catch (error) {
            return {
                totalWalletBalance: 0,
                botID
            }
        }
    },
    balanceWalletBE: async ({ amount, futureLarger, API_KEY, SECRET_KEY }) => {
        try {
            // FUND: Spot
            // UNIFIED: Future

            if (API_KEY && SECRET_KEY) {

                let FromWallet = "FUND"
                let ToWallet = "UNIFIED"

                if (futureLarger) {
                    FromWallet = "UNIFIED"
                    ToWallet = "FUND"
                }

                const client = new RestClientV5({
                    testnet: false,
                    key: API_KEY,
                    secret: SECRET_KEY,
                    syncTimeBeforePrivateRequests: true,

                });

                let myUUID = uuidv4();

                client.createInternalTransfer(
                    myUUID,
                    'USDT',
                    amount.toFixed(4),
                    FromWallet,
                    ToWallet,
                )
                    .then((response) => {
                        const status = response.result.status == "SUCCESS"
                        if (status) {
                            // console.log("-> Saving Successful");
                        }
                        else {
                            console.log("-> Saving Error");
                        }

                    })
                    .catch((error) => {
                        console.log("-> Saving Error");
                    });
            }
            else {
                console.log("-> Saving Error");
            }

        }
        catch (error) {
            console.log("-> Saving Error");
        }
    },

    getAllStrategiesActiveScannerBE: async () => {
        try {
            require("../../../../models/bot.model")

            const result = await ScannerModel.find({ IsActive: true }).populate("botID")
            return result || []

        } catch (err) {
            return []
        }
    },
    getAllSymbolBE: async (req, res) => {
        try {
            const result = await ScannerModel.find().select("value");
            return result || []

        } catch (err) {
            return []
        }
    },

    deleteAllScannerV1BE: async () => {
        try {

            const result = SpotModel.updateMany(
                {},
                { $pull: { "children": { scannerID: { $exists: true, $ne: null } } } }
            );
            const result2 = MarginModel.updateMany(
                {},
                { $pull: { "children": { scannerID: { $exists: true, $ne: null } } } }
            );

            await Promise.allSettled([result, result2])

            console.log("[V] Delete All Config By Scanner Successful");

        } catch (error) {
            console.log("[V] Delete All Config By Scanner Error:", error);
        }
    },
    deleteAllForUPcodeV1: async () => {

        try {

            // const cancelPositionV3 = PositionV1Model.deleteMany({})
            await Promise.allSettled([cancelPositionV3])

            console.log("[V] RESET All For New Successful");

        } catch (error) {
            console.log("[V] RESET All For New error:", error);
        }
    },
    addSymbolToBlacklistBE: async ({
        scannerID,
        symbol,
    }) => {
        try {
            const result = await ScannerModel.updateOne(
                { _id: scannerID },
                { $addToSet: { Blacklist: symbol } }
            );
            console.log(`[Mongo] Add ${symbol} to blacklist successful`);
            return true
        } catch (error) {
            console.log(`[Mongo] Add ${symbol} to blacklist error: ${error}`);
        }
    },

}

module.exports = dataCoinByBitController 