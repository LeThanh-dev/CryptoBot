const { RestClientV5, WebsocketClient } = require('bybit-api');
const StrategiesModel = require('../models/strategies')
const BotApiModel = require('../models/botApi.model')
const { v4: uuidv4 } = require('uuid');
const { default: mongoose } = require('mongoose');


const dataCoinByBitController = {

    // GET
    getSymbolFromCloud: async (userID) => {
        try {

            let ListCoin1m = []

            let wsConfig = {
                // key: API_KEY,
                // secret: PRIVATE_KEY,
                market: 'v5'
            }
            let wsInfo = {
                // key: API_KEY,
                // secret: PRIVATE_KEY,
                testnet: false,
                enable_time_sync: true,
                timestamp: new Date().toLocaleString(),
                recvWindow: 200000,
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

    getAllStrategies: async (req, res) => {
        try {
            const userID = req.user._id

            // const result = await StrategiesModel.find({ "children.userID": { "$in": [userID] } }).sort({ "label": 1 }).populate("children.botID")
            const resultFilter = await StrategiesModel.aggregate([
                {
                    $match: { "children.userID": new mongoose.Types.ObjectId(userID) }
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
                                    $eq: ["$$child.userID", new mongoose.Types.ObjectId(userID)],

                                }
                            }
                        }
                    }
                }
            ]);
            const result = await StrategiesModel.populate(resultFilter, {
                path: 'children.botID',
            })

            const handleResult = result.reduce((result, child) => {
                if (child.children.some(childData => childData.botID.Status === "Running")) {
                    result.push({
                        ...child,
                        children: child.children.filter(item => item.botID.Status === "Running")
                    })
                    return result
                }
            }, []) || []

            res.customResponse(res.statusCode, "Get All Strategies Successful", handleResult);

        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    },


    getAllSymbol: async (req, res) => {
        try {
            const result = await StrategiesModel.find();

            res.customResponse(res.statusCode, "Get All Symbol Successful", result.map(item => item.value));

        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    },
    getAllSymbolWith24: async (req, res) => {
        try {
            const result = await StrategiesModel.find();

            res.customResponse(res.statusCode, "Get All Symbol Successful", result.map(item => ({
                _id: item._id,
                symbol: item.value,
                volume24h: item.volume24h,
            })))

        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    },

    // CREATE
    createStrategies: async (req, res) => {

        try {
            const userID = req.user._id

            const { data: newData, botListId, Symbol } = req.body

            let result
            if (newData.PositionSide === "Both") {
                result = await StrategiesModel.updateMany(
                    { "value": { "$in": Symbol } },
                    {
                        "$push": {
                            "children": [
                                ...botListId.map(botID => ({ ...newData, PositionSide: "Long", botID, userID })),
                                ...botListId.map(botID => ({ ...newData, PositionSide: "Short", botID, userID }))
                            ]
                        }
                    }
                )
            }
            else {
                result = await StrategiesModel.updateMany(
                    { "value": { "$in": Symbol } },
                    { "$push": { "children": botListId.map(botID => ({ ...newData, botID, userID })) } }
                );
            }

            if (result.acknowledged && result.matchedCount !== 0) {

                res.customResponse(200, "Add New Strategies Successful", []);
            }
            else {
                res.customResponse(400, "Add New Strategies Failed", "");
            }

        }

        catch (error) {
            res.status(500).json({ message: error.message });
        }

    },

    // UPDATE
    updateStrategiesByID: async (req, res) => {
        try {

            const strategiesID = req.params.id;

            const { parentID, newData } = req.body

            const result = await StrategiesModel.updateOne(
                { "children._id": strategiesID, _id: parentID },
                { $set: { "children.$": newData } }
            )

            if (result.acknowledged && result.matchedCount !== 0) {
                res.customResponse(200, "Update Strategies Successful", "");
            }
            else {
                res.customResponse(400, "Update Strategies Failed", "");
            }

        } catch (error) {
            // Xử lý lỗi nếu có
            res.status(500).json({ message: "Update Strategies Error" });
        }
    },
    updateStrategiesMultiple: async (req, res) => {
        try {

            const dataList = req.body

            let resultAll = []

            for (data of dataList) {
                const result = await StrategiesModel.updateOne(
                    { "children._id": data.id, _id: data.parentID },
                    { $set: { "children.$": data.UpdatedFields } }
                )
                resultAll.push(result.acknowledged && result.matchedCount !== 0)
            }

            if (resultAll.every(result => result === true)) {
                res.customResponse(200, "Update Strategies Successful", "");
            }
            else {
                res.customResponse(400, "Update Strategies Failed", "");
            }

        } catch (error) {
            // Xử lý lỗi nếu có
            res.status(500).json({ message: "Update Strategies Error" });
        }
    },

    // DELETE
    deleteStrategies: async (req, res) => {
        try {

            const strategiesID = req.params.id;

            const result = await StrategiesModel.deleteOne(
                { _id: strategiesID },
            );


            if (result.acknowledged && result.deletedCount !== 0) {

                res.customResponse(200, "Delete Strategies Successful");
            }
            else {
                res.customResponse(400, "Delete Strategies failed");
            }

        } catch (error) {
            res.status(500).json({ message: "Delete Strategies Error" });
        }
    },
    deleteStrategiesItem: async (req, res) => {
        try {

            const { id, parentID } = req.body


            const result = await StrategiesModel.updateOne(
                { _id: parentID },
                { $pull: { children: { _id: id } } }
            );

            if (result.acknowledged && result.deletedCount !== 0) {

                res.customResponse(200, "Delete Strategies Successful");
            }
            else {
                res.customResponse(400, "Delete Strategies failed");
            }

        } catch (error) {
            res.status(500).json({ message: "Delete Strategies Error" });
        }
    },
    deleteStrategiesMultiple: async (req, res) => {
        try {

            const strategiesIDList = req.body

            let resultAll = []

            for (data of strategiesIDList) {
                const result = await StrategiesModel.updateOne(
                    { _id: data.parentID },
                    { $pull: { children: { _id: data.id } } }
                );
                resultAll.push(result.acknowledged && result.matchedCount !== 0)
            }

            // if (result.acknowledged && result.deletedCount !== 0) {
            if (resultAll.every(result => result === true)) {

                res.customResponse(200, "Delete Strategies Successful");
            }
            else {
                res.customResponse(400, "Delete Strategies failed");
            }

        } catch (error) {
            res.status(500).json({ message: "Delete Strategies Error" });
        }
    },

    // OTHER

    copyMultipleStrategiesToSymbol: async (req, res) => {

        try {
            const { symbolListData, symbolList } = req.body

            const newData = symbolListData.map(data => {
                const newObj = { ...data };

                delete newObj?._id
                delete newObj?.value
                return newObj
            })

            const result = await StrategiesModel.updateMany(
                { "value": { "$in": symbolList } },
                {
                    "$push": {
                        "children": newData
                    }
                }
            );

            if (result.acknowledged && result.matchedCount !== 0) {

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
    copyMultipleStrategiesToBot: async (req, res) => {

        try {
            const { symbolListData, symbolList } = req.body


            let resultAll = []

            for (data of symbolListData) {
                const newObj = { ...data };

                delete newObj?._id
                delete newObj?.value
                const result = await StrategiesModel.updateOne(
                    { "_id": newObj.parentID },
                    {
                        "$push": {
                            "children": symbolList.map(item => ({
                                ...newObj,
                                botID: item
                            }))
                        }
                    }
                )
                resultAll.push(result.acknowledged && result.matchedCount !== 0)
            }

            if (resultAll.every(result => result === true)) {
                res.customResponse(200, "Copy Strategies To Bot Successful", "");
            }
            else {
                res.customResponse(400, "Copy Strategies To Bot Failed", "");
            }
        }

        catch (error) {
            res.status(500).json({ message: error.message });
        }

    },

    syncSymbol: async (req, res) => {
        try {
            const userID = req.user._id

            const listSymbolObject = await dataCoinByBitController.getSymbolFromCloud(userID);

            if (listSymbolObject?.length) {


                const existingDocs = await StrategiesModel.find({ value: { $in: listSymbolObject.map(item => item.symbol) } });

                const existingValues = existingDocs.map(doc => doc.value);

                const valuesToAdd = listSymbolObject.filter(value => !existingValues.includes(value.symbol));

                await StrategiesModel.insertMany(valuesToAdd.map(value => ({
                    label: value.symbol,
                    value: value.symbol,
                    volume24h: value.volume24h,
                    children: []
                })))
                valuesToAdd.length > 0 ? res.customResponse(200, "Have New Sync Successful", []) : res.customResponse(200, "Sync Successful", []);
            }
            else {
                res.customResponse(400, "Sync Failed", []);

            }

        } catch (error) {
            res.status(500).json({ message: error.message });
        }
    },

    transferFunds: async (amount, FromWallet, ToWallet) => {

        const client = new RestClientV5({
            key: API_KEY,
            secret: SECRET_KEY,
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

        const resultApi = await BotApiModel.findOne({ botID })

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
                    enable_time_sync: true,
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
                    enable_time_sync: true,
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
                        future: result[0]?.result?.list?.[0]?.totalWalletBalance || 0,
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
                });

                // get field totalWalletBalance
                const result = await client.getWalletBalance({
                    accountType: 'UNIFIED',
                    coin: 'USDT',
                })

                if (result.retCode === 0) {
                    return {
                        totalWalletBalance:result.result?.list?.[0]?.totalWalletBalance || 0,
                        botID
                    }
                }
                return 0

            }
        } catch (error) {
            return 0

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

    getAllStrategiesActive: async () => {
        try {
            require("../models/bot.model")

            const resultFilter = await StrategiesModel.aggregate([
                {
                    $match: { "children.IsActive": true }
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
                                cond: { $eq: ["$$child.IsActive", true] }
                            }
                        }
                    }
                }
            ]);
            const result = await StrategiesModel.populate(resultFilter, {
                path: 'children.botID',
            })

            const handleResult = result.reduce((result, child) => {
                if (child.children.some(childData => childData.botID.Status === "Running")) {
                    result.push({
                        ...child,
                        children: child.children.filter(item => item.botID.Status === "Running")
                    })
                    return result
                }
            }, []) || []
            return handleResult

        } catch (err) {
            return []
        }
    },
    getAllSymbolBE: async (req, res) => {
        try {
            const result = await StrategiesModel.find();
            return result.map(item => item.value) || []

        } catch (err) {
            return []
        }
    },

}

module.exports = dataCoinByBitController 