// const { ObjectId } = require('mongodb');
const BotModel = require('../models/bot.model');
const UserModel = require('../models/user.model');
const StrategiesModel = require('../models/strategies.model');
const { default: mongoose } = require('mongoose');

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
        IsActive
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
            child.IsActive = IsActive
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

            // ref: .populate({ path: "coinID", models: "Coin" })
            const data = await BotModel.find({
                userID,
                "Status": "Running",
                ApiKey: { $exists: true, $ne: null },
                SecretKey: { $exists: true, $ne: null }
            }, { telegramToken: 0 }).sort({ Created: -1 }).populate("userID", "userName roleName");
            res.customResponse(res.statusCode, "Get All Bot Successful", data);

        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    },
    getAllBotOnlyApiKeyByUserID: async (req, res) => {
        try {
            const userID = req.params.id;

            // ref: .populate({ path: "coinID", models: "Coin" })
            const data = await BotModel.find({
                userID,
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
            res.status(500).json({ message: "Add New Bot Error" });
        }
    },
    updateBot: async (req, res) => {
        try {

            const botID = req.params.id;


            const { type, checkBot, ...data } = req.body;

            const dataCheckBotApi = await BotModel.findOne({
                ApiKey: data.ApiKey
            }
            ).sort({ Created: -1 })


            if (!dataCheckBotApi) {

                const result = await BotModel.updateOne({ _id: botID }, { $set: data })

                if (type === "Active") {
                    if (checkBot) {
                        const IsActive = data.Status === "Running" ? true : false;

                        const newDataSocketWithBotData = await BotController.getAllStrategiesByBotID({
                            botID,
                            IsActive
                        })

                        newDataSocketWithBotData.length > 0 && BotController.sendDataRealtime({
                            type: "bot-update",
                            data: newDataSocketWithBotData
                        })

                    }
                }
                else if (type === "Api") {
                    if (checkBot) {
                        const newDataSocketWithBotData = await BotController.getAllStrategiesByBotID({
                            botID,
                            IsActive: true
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
                }
                else if (type === "telegram") {
                    if (checkBot) {
                        const newDataSocketWithBotData = await BotController.getAllStrategiesByBotID({
                            botID,
                            IsActive: true
                        })

                        newDataSocketWithBotData.length > 0 && BotController.sendDataRealtime({
                            type: "bot-telegram",
                            data: {
                                newData: newDataSocketWithBotData,
                                botID,
                                newApiData: {
                                    telegramIDOld: data.telegramIDOld,
                                    telegramID: data.telegramID,
                                    telegramToken: data.telegramToken,
                                }
                            }
                        })
                    }
                }

                if (result.acknowledged && result.matchedCount !== 0) {
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
            // Xử lý lỗi nếu có
            res.status(500).json({ message: "Update Bot Error" });
        }
    },
    deleteBot: async (req, res) => {
        try {
            const botID = req.params.id;

            const result = await BotModel.deleteOne({ _id: botID })
            // const resultStrategies = StrategiesModel.deleteOne({ botID })

            const newDataSocketWithBotData = await BotController.getAllStrategiesByBotID({
                botID,
                IsActive: true
            })

            newDataSocketWithBotData.length > 0 && BotController.sendDataRealtime({
                type: "bot-delete",
                data: {
                    newData: newDataSocketWithBotData,
                    botID,
                }
            })

            if (result.deletedCount !== 0) {
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

            const result = await BotModel.deleteMany({ _id: { $in: botIDList } })
            const resultStrategies = await StrategiesModel.updateMany(
                { "children.botID": { $in: botIDList } },
                { $pull: { children: { botID: { $in: botIDList } } } }
            );

            const resultAll = await Promise.all([result, resultStrategies])

            if (resultAll.some(item => item.deletedCount !== 0)) {
                res.customResponse(200, "Delete Bot Successful");
            }
            else {
                res.customResponse(400, "Delete Bot failed", "");
            }

        } catch (error) {
            res.status(500).json({ message: "Delete Bot Error" });
        }
    },

    // OTHER 

    getAllBotActive: async () => {
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