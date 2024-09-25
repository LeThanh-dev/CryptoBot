// const { ObjectId } = require('mongodb');
const BotModel = require('../models/bot.model');
const UserModel = require('../models/user.model');
const StrategiesModel = require('../models/strategies.model');
const SpotModel = require('../models/spot.model');
const MarginModel = require('../models/margin.model');
const ScannerV3Model = require('../models/scannerV3.model');
const ScannerV1Model = require('../models/scanner.model');
const { default: mongoose } = require('mongoose');

// ByBitV3

const BotController = {
    // SOCKET

    sendDataRealtime: ({
        type,
        data
    }) => {
        const { socketServer } = require('../serverConfig');
        socketServer.emit(type, data)
    },
    getAllStrategiesByBotID: async ({
        botID,
    }) => {
        const resultFilter = await StrategiesModel.aggregate([
            {
                $match: {
                    "children.botID": new mongoose.Types.ObjectId(botID)
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
                                $and: [
                                    { $eq: ["$$child.botID", new mongoose.Types.ObjectId(botID)] }
                                ]
                            }
                        }
                    }
                }
            }
        ]);
        const result = await StrategiesModel.populate(resultFilter, {
            path: 'children.botID',
        })

        const newDataSocketWithBotData = result.flatMap((data) => data.children.map(child => {
            child.symbol = data.value
            child.value = `${data._id}-${child._id}`
            // child.IsActive = IsActive !== "not-modified" ? IsActive : child.IsActive
            return child
        })) || []

        return newDataSocketWithBotData;
    },
    getAllStrategiesV1ByBotID: async ({
        botID,
    }) => {
        const resultFilter = await SpotModel.aggregate([
            {
                $match: {
                    "children.botID": new mongoose.Types.ObjectId(botID)
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
                                $and: [
                                    { $eq: ["$$child.botID", new mongoose.Types.ObjectId(botID)] }
                                ]
                            }
                        }
                    }
                }
            }
        ]);
        const result = await SpotModel.populate(resultFilter, {
            path: 'children.botID',
        })

        const newDataSocketWithBotData = result.flatMap((data) => data.children.map(child => {
            child.symbol = data.value
            child.value = `SPOT-${data._id}-${child._id}`
            return child
        })) || []

        const resultFilter2 = await MarginModel.aggregate([
            {
                $match: {
                    "children.botID": new mongoose.Types.ObjectId(botID)
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
                                $and: [
                                    { $eq: ["$$child.botID", new mongoose.Types.ObjectId(botID)] }
                                ]
                            }
                        }
                    }
                }
            }
        ]);
        const result2 = await MarginModel.populate(resultFilter2, {
            path: 'children.botID',
        })

        const newDataSocketWithBotData2 = result2.flatMap((data) => data.children.map(child => {
            child.symbol = data.value
            child.value = `MARGIN-${data._id}-${child._id}`
            return child
        })) || []

        return newDataSocketWithBotData.concat(newDataSocketWithBotData2);
    },
    getAllStrategiesSpotByBotID: async ({
        botID,
        IsActive
    }) => {
        const resultFilter = await SpotModel.aggregate([
            {
                $match: {
                    "children.botID": new mongoose.Types.ObjectId(botID)
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
                                $and: [
                                    { $eq: ["$$child.botID", new mongoose.Types.ObjectId(botID)] }
                                ]
                            }
                        }
                    }
                }
            }
        ]);
        const result = await SpotModel.populate(resultFilter, {
            path: 'children.botID',
        })

        const newDataSocketWithBotData = result.flatMap((data) => data.children.map(child => {
            child.symbol = data.value
            child.value = `${data._id}-${child._id}`
            child.IsActive = IsActive !== "not-modified" ? IsActive : child.IsActive
            return child
        })) || []

        return newDataSocketWithBotData;
    },
    getAllStrategiesMarginByBotID: async ({
        botID,
        IsActive
    }) => {
        const resultFilter = await MarginModel.aggregate([
            {
                $match: {
                    "children.botID": new mongoose.Types.ObjectId(botID)
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
                                $and: [
                                    { $eq: ["$$child.botID", new mongoose.Types.ObjectId(botID)] }
                                ]
                            }
                        }
                    }
                }
            }
        ]);
        const result = await MarginModel.populate(resultFilter, {
            path: 'children.botID',
        })

        const newDataSocketWithBotData = result.flatMap((data) => data.children.map(child => {
            child.symbol = data.value
            child.value = `${data._id}-${child._id}`
            child.IsActive = IsActive !== "not-modified" ? IsActive : child.IsActive
            return child
        })) || []

        return newDataSocketWithBotData;
    },
    // 
    getAllBot: async (req, res) => {
        try {
            // ref: .populate({ path: "coinID", models: "Coin" })
            const data = await BotModel.find({}, { telegramToken: 0 }).sort({ Created: -1 }).populate("userID", "userName roleName");
            res.customResponse(res.statusCode, "Get All Bot Successful", data);

        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    },

    getAllBotByUserID: async (req, res) => {
        try {
            const userID = req.params.id;

            // ref: .populate({ path: "coinID", models: "Coin" })
            const data = await BotModel.find({ userID }, { telegramToken: 0 }).sort({ Created: -1 }).populate("userID", "userName roleName");
            res.customResponse(res.statusCode, "Get All Bot Successful", data);

        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    },
    getAllBotActiveByUserID: async (req, res) => {
        try {
            const userID = req.params.id;
            const botType = req.query.botType

            // ref: .populate({ path: "coinID", models: "Coin" })
            const data = await BotModel.find({
                userID,
                "Status": "Running",
                "botType": botType,
                ApiKey: { $exists: true, $ne: null },
                SecretKey: { $exists: true, $ne: null }
            }, { telegramToken: 0 }).sort({ Created: -1 }).populate("userID", "userName roleName");
            res.customResponse(res.statusCode, "Get All Bot Successful", data);

        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    },

    getAllBotActive: async (req, res) => {
        const botType = req.query.botType

        try {
            // ref: .populate({ path: "coinID", models: "Coin" })
            const data = await BotModel.find(
                {
                    Status: "Running",
                    "botType": botType,
                    ApiKey: { $exists: true, $ne: null },
                    SecretKey: { $exists: true, $ne: null }
                }
            ).sort({ Created: -1 })
            res.customResponse(200, "Get All Bot Active Successful", data);

        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    },
    getAllBotOnlyApiKeyByUserID: async (req, res) => {
        try {
            const userID = req.params.id;
            const botType = req.query.botType

            // ref: .populate({ path: "coinID", models: "Coin" })
            const data = await BotModel.find({
                userID,
                botType,
                ApiKey: { $exists: true, $ne: null },
                SecretKey: { $exists: true, $ne: null }
            }, { telegramToken: 0 }).sort({ Created: -1 })
            res.customResponse(res.statusCode, "Get All Bot Successful", data);

        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    },
    getAllBotBySameGroup: async (req, res) => {
        try {
            const groupID = req.params.id;

            const resultGetAllUsersID = await UserModel.find({ groupID }, { telegramToken: 0 }).select('_id');

            // ref: .populate({ path: "coinID", models: "Coin" })
            const data = await BotModel.find({ userID: { $in: resultGetAllUsersID } }).sort({ Created: -1 }).populate("userID", "userName roleName");
            res.customResponse(res.statusCode, "Get All Bot Successful", data);

        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    },
    getByID: async (req, res) => {
        try {
            const botID = req.params.id;
            const data = await BotModel.findById(botID).sort({ Created: -1 });
            res.customResponse(res.statusCode, "Get Bot By ID Successful", data);

        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    },
    createBot: async (req, res) => {
        try {

            const userID = req.user._id

            const newBot = new BotModel({
                ...req.body,
                Created: new Date(),
                userID
            });

            const savedBot = await newBot.save();

            res.customResponse(res.statusCode, "Add New Bot Successful", savedBot);

        } catch (error) {
            // Xử lý lỗi nếu có
            console.log(error);
            res.status(500).json({ message: "Add New Bot Error" });
        }
    },
    updateBot: async (req, res) => {
        try {

            const botID = req.params.id;

            const { type, checkBot, botType, ...data } = req.body;

            let dataCheckBotApi = false

            if (data.ApiKey) {
                dataCheckBotApi = await BotModel.findOne({
                    ApiKey: data.ApiKey,
                    _id: { $ne: botID },
                    botType
                })

            }

            if (!dataCheckBotApi) {

                const result = await BotModel.updateOne({ _id: botID }, { $set: data })

                if (result.acknowledged && result.matchedCount !== 0) {
                    switch (botType) {
                        case "ByBitV3":
                            if (checkBot) {
                                if (type === "Active") {
                                    const IsActive = data.Status === "Running" ? true : false;

                                    if (!IsActive) {
                                        const deActiveScanner = ScannerV3Model.updateMany({ botID }, { IsActive: false })
                                        const deActiveStrategies = StrategiesModel.updateMany(
                                            { "children.botID": botID },
                                            {
                                                $set: {
                                                    "children.$[elem].IsActive": false,
                                                }
                                            },
                                            {
                                                arrayFilters: [{ "elem.botID": botID }]
                                            }
                                        );

                                        await Promise.allSettled([deActiveScanner, deActiveStrategies])
                                    }
                                    const newDataSocketWithBotData = await BotController.getAllStrategiesByBotID({
                                        botID,
                                    })

                                    newDataSocketWithBotData.length > 0 && BotController.sendDataRealtime({
                                        type: "bot-update",
                                        data: {
                                            newData: newDataSocketWithBotData,
                                            botIDMain: botID,
                                            botActive: IsActive
                                        }
                                    })

                                }
                                else if (type === "Api") {
                                    const newDataSocketWithBotData = await BotController.getAllStrategiesByBotID({
                                        botID,
                                    })

                                    newDataSocketWithBotData.length > 0 && BotController.sendDataRealtime({
                                        type: "bot-api",
                                        data: {
                                            newData: newDataSocketWithBotData,
                                            botID,
                                            newApiData: {
                                                ApiKey: data.ApiKey,
                                                SecretKey: data.SecretKey
                                            }
                                        }
                                    })
                                }
                                else if (type === "telegram") {

                                    const newDataSocketWithBotData = await BotController.getAllStrategiesByBotID({
                                        botID,
                                    })

                                    newDataSocketWithBotData.length > 0 && BotController.sendDataRealtime({
                                        type: "bot-telegram",
                                        data: {
                                            newData: newDataSocketWithBotData,
                                            botID,
                                            newApiData: {
                                                telegramTokenOld: data.telegramTokenOld,
                                                telegramID: data.telegramID,
                                                telegramToken: data.telegramToken,
                                                botName: data.botName,
                                            }
                                        }
                                    })
                                }
                            }
                            break;
                        case "ByBitV1":
                            if (checkBot) {
                                if (type === "Active") {
                                    const IsActive = data.Status === "Running" ? true : false;

                                    if (!IsActive) {
                                        const deActiveScanner = ScannerV1Model.updateMany({ botID }, { IsActive: false })
                                        const deActiveStrategies = SpotModel.updateMany(
                                            { "children.botID": botID },
                                            {
                                                $set: {
                                                    "children.$[elem].IsActive": false,
                                                }
                                            },
                                            {
                                                arrayFilters: [{ "elem.botID": botID }]
                                            }
                                        );
                                        const deActiveStrategiesMargin = MarginModel.updateMany(
                                            { "children.botID": botID },
                                            {
                                                $set: {
                                                    "children.$[elem].IsActive": false,
                                                }
                                            },
                                            {
                                                arrayFilters: [{ "elem.botID": botID }]
                                            }
                                        );

                                        await Promise.allSettled([deActiveScanner, deActiveStrategies,deActiveStrategiesMargin])
                                    }
                                    const newDataSocketWithBotData = await BotController.getAllStrategiesV1ByBotID({
                                        botID,
                                    })

                                    newDataSocketWithBotData.length > 0 && BotController.sendDataRealtime({
                                        type: "bot-update",
                                        data: {
                                            newData: newDataSocketWithBotData,
                                            botIDMain: botID,
                                            botActive: IsActive
                                        }
                                    })

                                }
                                else if (type === "Api") {
                                    const newDataSocketWithBotData = await BotController.getAllStrategiesV1ByBotID({
                                        botID,
                                    })

                                    newDataSocketWithBotData.length > 0 && BotController.sendDataRealtime({
                                        type: "bot-api",
                                        data: {
                                            newData: newDataSocketWithBotData,
                                            botID,
                                            newApiData: {
                                                ApiKey: data.ApiKey,
                                                SecretKey: data.SecretKey
                                            }
                                        }
                                    })
                                }
                                else if (type === "telegram") {

                                    const newDataSocketWithBotData = await BotController.getAllStrategiesV1ByBotID({
                                        botID,
                                    })

                                    newDataSocketWithBotData.length > 0 && BotController.sendDataRealtime({
                                        type: "bot-telegram",
                                        data: {
                                            newData: newDataSocketWithBotData,
                                            botID,
                                            newApiData: {
                                                telegramTokenOld: data.telegramTokenOld,
                                                telegramID: data.telegramID,
                                                telegramToken: data.telegramToken,
                                                botName: data.botName,
                                            }
                                        }
                                    })
                                }
                            }
                            break;

                        default:
                            break;
                    }


                    res.customResponse(200, "Update Bot Successful", "");
                }
                else {
                    res.customResponse(400, "Update Bot failed", "");
                }
            }
            else {
                res.customResponse(400, "Api Bot Already Exists", "");
            }

        } catch (error) {
            console.log(error);
            // Xử lý lỗi nếu có
            res.status(500).json({ message: "Update Bot Error" });
        }
    },
    deleteBot: async (req, res) => {
        try {
            const botID = req.params.id;
            const botType = req.query.botType

            const newDataSocketWithBotData = await BotController.getAllStrategiesByBotID({
                botID,
            })

            newDataSocketWithBotData.length > 0 && BotController.sendDataRealtime({
                type: "bot-delete",
                data: {
                    newData: newDataSocketWithBotData,
                    botID,
                }
            })

            const result = await BotModel.deleteOne({ _id: botID })

            await ScannerV3Model.deleteMany({ botID })

            if (result.deletedCount !== 0) {

                switch (botType) {
                    case "ByBitV3":

                        await StrategiesModel.updateMany(
                            { "children.botID": botID },
                            { $pull: { children: { botID: botID } } }
                        );
                        break
                    case "ByBitV1":

                        const deleteAllSpot = SpotModel.updateMany(
                            { "children.botID": botID },
                            { $pull: { children: { botID: botID } } }
                        );
                        const deleteAllMargin = MarginModel.updateMany(
                            { "children.botID": botID },
                            { $pull: { children: { botID: botID } } }
                        );

                        await Promise.allSettled([deleteAllSpot, deleteAllMargin])
                        break
                }


                res.customResponse(200, "Delete Bot Successful");
            }
            else {
                res.customResponse(400, "Delete Bot failed", "");
            }

        } catch (error) {
            res.status(500).json({ message: "Delete Bot Error" });
        }
    },
    deleteMultipleBot: async (req, res) => {
        try {
            const botIDList = req.body
            const botType = req.query.botType

            const botID = botIDList[0]

            let newDataSocketWithBotData = []

            switch (botType) {
                case "ByBitV3":
                    newDataSocketWithBotData = await BotController.getAllStrategiesByBotID({
                        botID,
                    })
                case "ByBitV1":
                    newDataSocketWithBotData = await BotController.getAllStrategiesV1ByBotID({
                        botID,
                    })
                    break
            }

            const result = await BotModel.deleteMany({ _id: { $in: botIDList } })
            let resultStrategies
            switch (botType) {
                case "ByBitV3":
                    resultStrategies = StrategiesModel.updateMany(
                        { "children.botID": { $in: botIDList } },
                        { $pull: { children: { botID: { $in: botIDList } } } }
                    );
                    break
                case "ByBitV1":
                    const spotDelete = SpotModel.updateMany(
                        { "children.botID": { $in: botIDList } },
                        { $pull: { children: { botID: { $in: botIDList } } } }
                    );
                    const marginDelete = MarginModel.updateMany(
                        { "children.botID": { $in: botIDList } },
                        { $pull: { children: { botID: { $in: botIDList } } } }
                    );
                    resultStrategies = Promise.allSettled([spotDelete, marginDelete]);
                    break
            }


            await Promise.all([result, resultStrategies])

            newDataSocketWithBotData.length > 0 && BotController.sendDataRealtime({
                type: "bot-delete",
                data: {
                    newData: newDataSocketWithBotData,
                    botID,
                }
            })

            res.customResponse(200, "Delete Bot Successful");


        } catch (error) {
            res.status(500).json({ message: "Delete Bot Error" });
        }
    },

    setMargin: async (req, res) => {
        try {

            const botData = req.body;

            const allSymbolMargin = []

            const { RestClientV5 } = require('bybit-api');

            const client = new RestClientV5({
                testnet: false,
                key: botData.ApiKey,
                secret: botData.SecretKey,
                syncTimeBeforePrivateRequests: true,
            });

            await client.getCollateralInfo()
                .then((rescoin) => {
                    rescoin.result.list.forEach(coinData => {
                        const coin = coinData.currency
                        if (coinData.marginCollateral && !["USDT", "USDC"].includes(coin)) {
                            allSymbolMargin.push({
                                coin,
                                collateralSwitch: 'ON',
                            })
                        }
                    })
                })


            try {

                const resSet = await client.batchSetCollateralCoin({ request: allSymbolMargin })

                if (resSet.retCode == 0) {
                    res.customResponse(200, "Set Margin Bot Successful", allSymbolMargin);
                }
                else {
                    res.customResponse(400, resSet.retMsg, allSymbolMargin);
                }

            } catch (error) {
                throw new Error(error)
            }
        } catch (error) {
            // Xử lý lỗi nếu có
            res.status(500).json({ message: `Set Margin Bot Error: ${error.message}` });
        }
    },

    // OTHER 

    getAllBotActiveBE: async () => {
        try {
            // ref: .populate({ path: "coinID", models: "Coin" })
            const data = await BotModel.find(
                {
                    Status: "Running",
                    ApiKey: { $exists: true, $ne: null },
                    SecretKey: { $exists: true, $ne: null }
                }
            ).sort({ Created: -1 })
            return data
        } catch (err) {
            return []
        }
    },

}

module.exports = BotController 