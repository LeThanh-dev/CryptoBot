// const { ObjectId } = require('mongodb');
const GroupModel = require('../models/group.model');
const UserModel = require('../models/user.model');

const GroupController = {
    getAll: async (req, res) => {

        const userName = req.user?.userName
        const userID = req.user?._id
        const conditionGet = userName !== "SuperAdmin" ? {
            userID
        }: {};


        try {
            const data = await GroupModel.find(conditionGet).populate("userID", { password: 0 })
            res.customResponse(res.statusCode, "Get All Group Successful", data);

        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    },

    getGroupByUserIDCreated: async (req, res) => {
        try {
            const userID = req.params.id
            const data = await GroupModel.find({userID})
            res.customResponse(res.statusCode, "Get Group By UserID Successful", data);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    },

    getGroupByID: async (req, res) => {
        try {
            const groupID = req.params.id
            const data = await GroupModel.findById(groupID)
            res.customResponse(res.statusCode, "Get Group By ID Successful", data);
        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    },

    create: async (req, res) => {
        try {

            const userID = req.user._id

            const newBot = new GroupModel({
                ...req.body,
                userID
            });


            const dataSaved = await newBot.save();

            const groupID = dataSaved._id

            if (groupID) {

                const { member } = req.body

                if (member?.length > 0) {
                    const result = await UserModel.updateMany(
                        { "_id": { "$in": member.map(item => item.userID) } },
                        { "$set": { "groupID": groupID } }
                    );

                    if (result.acknowledged && result.matchedCount !== 0) {
                        res.customResponse(200, "Add New Successful", "");
                    }
                    else {
                        res.customResponse(400, "Add User To Group Failed", "");
                    }
                }
                else {
                    res.customResponse(200, "Add New Successful", "");
                }
            }
            else {
                res.customResponse(400, "Add New Failed", dataSaved);
            }


        } catch (error) {
            // Xử lý lỗi nếu có
            res.status(500).json({ message: "Add New Error" });
        }
    },
    update: async (req, res) => {
        try {

            const groupID = req.params.id;

            const updateGroup = GroupModel.updateOne({ _id: groupID }, { $set: req.body })

            const { memberRemove, member } = req.body

            const removeUserGroup = UserModel.updateMany(
                { "_id": { "$in": memberRemove.map(item => item.userID) } },
                { "$unset": { "groupID": "" } }
            );

            const addUserGroup = UserModel.updateMany(
                { "_id": { "$in": member.map(item => item.userID) } },
                { "$set": { "groupID": groupID } }
            );

            const resultAll = await Promise.all([updateGroup, removeUserGroup, addUserGroup])

            if (resultAll[0].acknowledged && resultAll[0].matchedCount !== 0) {
                res.customResponse(200, "Update Successful", "");
            }
            else {
                res.customResponse(400, "Update failed", "");
            }

        } catch (error) {
            // Xử lý lỗi nếu có
            res.status(500).json({ message: "Update Error" });
        }
    },

    deleteMultiple: async (req, res) => {
        try {
            const groupIDList = req.body

            const deleteGroup = GroupModel.deleteMany({ _id: { $in: groupIDList } })
            const deleteUser = UserModel.updateMany(
                { "groupID": { "$in": groupIDList } },
                { "$unset": { "groupID": "" } }
            );

            const resultAll = await Promise.all([deleteGroup, deleteUser])

            if (resultAll[0].deletedCount) {
                res.customResponse(200, "Delete Successful", "");
            }
            else {
                res.customResponse(400, "Delete failed", "");
            }


        } catch (error) {
            res.status(500).json({ message: "Delete Error" });
        }
    },


}

module.exports = GroupController 