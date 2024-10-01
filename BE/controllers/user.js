const bcrypt = require('bcrypt');
const UserModel = require('../models/user.model')
const GroupModel = require('../models/group.model')
// Tạo JWT token

const UserController = {

    initCreateAccount: async () => {
        try {
            const userName = "SuperAdmin"
            const password = "SuperAdmin$$T.;"
            const roleName = "SuperAdmin"

            const hashedPassword = await bcrypt.hash(password, 10);
            // Tạo người dùng mới
            const newUser = new UserModel({ userName, password: hashedPassword, roleName, isActive: true });

            const savedBot = await newUser.save();

            if (savedBot) {
                console.log("\n[V] Add Account SuperAdmin Successful");
            }
            else {
                console.log("\n[!] Add Account SuperAdmin Failed");
            }

        } catch (error) {
            console.error("\n[!] ERROR:\n", error.message);
        }
    },
    changePassword: async (req, res) => {
        try {
            const { userID, OldPassword, NewPassword } = req.body;


            const existingUser = await UserModel.findById(userID);
            if (!existingUser) {
                return res.customResponse(404, "UserName not found", "");
            }
            const passCompare = await bcrypt.compare(OldPassword, existingUser.password);
            if (passCompare) {

                const hashedPassword = await bcrypt.hash(NewPassword, 10);
                // Tạo người dùng mới
                const result = await UserModel.updateOne({ _id: userID }, {
                    $set: {
                        password: hashedPassword,
                    }
                })

                if (result.acknowledged && result.matchedCount !== 0) {
                    res.customResponse(200, "Change Password Successful", "");
                }
                else {

                    res.customResponse(400, "Change Password Failed", "");
                }
            }
            else {
                res.customResponse(400, "Old Password Not Correct", "");
            }

        } catch (error) {

            res.customResponse(500, "Change Password Error", "");
        }
    },
    getAllUser: async (req, res) => {
        try {
            const data = await UserModel.find({}, { password: 0 }).populate("groupID")
            if (data) {
                return res.customResponse(200, "Get All User Successful", data);
            }
            else {
                return res.customResponse(400, "Get All User Failed", "");
            }

        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    },
    getUserByID: async (req, res) => {
        try {
            const userID = req.params.userID;
            const data = await UserModel.findById(userID, { password: 0 })
            res.customResponse(res.statusCode, "Get UserData Successful", data);

        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    },
    getAllUserWithoutGroup: async (req, res) => {
        try {
            const data = await UserModel.find(
                {
                    roleName: { $in: ["Trader", "ManagerTrader"] },
                    groupID: { $exists: false }
                },
                { password: 0 }
            );
            res.customResponse(res.statusCode, "Get All User Successful", data);

        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    },
    getAllUserByUserIDList: async (req, res) => {
        const userIDList = req.body;
        try {
            const data = await UserModel.find({ _id: { $in: userIDList } }, { password: 0 });
            res.customResponse(res.statusCode, "Get All User Successful", data);

        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    },
    getAllUserByGroupID: async (req, res) => {
        const groupIDList = req.body;
        try {

            const data = await UserModel.find({ "groupID": { $in: groupIDList } }, { password: 0 }).populate("groupID");
            if (data) {
                return res.customResponse(200, "Get All User Successful", data);
            }
            else {
                return res.customResponse(400, "Get All User Failed", "");
            }


        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    },

    getAllUserByRoleName: async (req, res) => {
        try {
            let data = {}
            const { roleName, groupID } = req.body;
            const userID = req.user._id

            switch (roleName) {
                case "SuperAdmin":
                    data = await UserModel.find({
                        _id: { $ne: userID },
                        isActive: true
                    }, { password: 0 }).populate("groupID");
                    break
                case "Admin":
                    const groups = await GroupModel.find({ userID }).populate("member.userID");

                    data = groups.flatMap(group => group.member.map(member => {
                        const { password,...newData } = member.userID.toObject()
                        return {
                            ...newData,
                            groupID: group
                        }
                    }));
                    break
                case "ManagerTrader":
                    data = await UserModel.find({
                        _id: { $ne: userID },
                        roleName: { $in: ["Trader"] },
                        isActive: true,
                        groupID: { $eq: groupID, $ne: null }
                    }, { password: 0 }).populate("groupID");
                    break
            }
            res.customResponse(res.statusCode, "Get UserData Switch Successful", data);

        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    },

    createNewUser: async (req, res) => {
        try {
            const { password, roleName, ...data } = req.body;

            if (roleName == "SuperAdmin") {
                throw Error()
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            // Tạo người dùng mới
            const newUser = new UserModel({
                ...data,
                password: hashedPassword,
                roleName: roleName ? roleName : "Trader",
            });

            const savedBot = await newUser.save();

            const groupID = data.groupID
            if (groupID) {
                const result = await GroupModel.updateOne(
                    {
                        _id: groupID
                    },
                    {
                        "$push": {
                            "member": { userID: savedBot._id }
                        }
                    }
                )
                if (result.acknowledged && result.matchedCount !== 0) {
                    res.customResponse(res.statusCode, "Create User Successful", savedBot);
                }
                else {
                    res.customResponse(400, "Add User To Group failed", "");
                }
            }
            else {
                savedBot && res.customResponse(res.statusCode, "Create User Successful", savedBot);
            }


        } catch (error) {
            // Xử lý lỗi nếu có
            if (error.code === 11000 && error.keyPattern && error.keyPattern.userName) {
                return res.customResponse(400, "UserName already exists", "");
            }
            res.customResponse(500, "Create User Error", "");
        }
    },

    updateUser: async (req, res) => {
        try {
            const userID = req.params.id;
            const { newData } = req.body;

            if (newData?.roleName == "SuperAdmin") {
                throw Error()
            }
            if (newData.password) {
                const hashedPassword = await bcrypt.hash(newData.password, 10);
                newData.password = hashedPassword
            }
            const result = await UserModel.updateOne({ _id: userID }, { $set: newData })

            const groupID = newData?.groupID
            const oldGroupID = newData?.oldGroupID


            if (oldGroupID !== groupID) {
                const result = GroupModel.updateOne(
                    {
                        _id: groupID
                    },
                    {
                        "$addToSet": {
                            "member": { userID: userID }
                        }
                    }
                )
                const resultRemove = GroupModel.updateOne(
                    {
                        _id: oldGroupID
                    },
                    {
                        "$pull": {
                            "member": { userID: userID }
                        }

                    }
                )
                const resultRemoveGroup = !groupID && UserModel.updateOne({ _id: userID }, { $unset: { "groupID": "" } })

                const resultAll = await Promise.all([result, resultRemove, resultRemoveGroup])

                if (resultAll.some(item => item.acknowledged) && resultAll.some(item => item.matchedCount !== 0)) {
                    res.customResponse(200, "Update User Successful", "");
                }
                else {
                    res.customResponse(400, "Handle User In Group failed", "");
                }
            }
            else {
                if (result.acknowledged && result.matchedCount !== 0) {
                    res.customResponse(200, "Update User Successful", "");
                }
                else {
                    return res.customResponse(400, "Update User Failed", "");
                }
            }

        } catch (error) {

            res.customResponse(500, "Update User Error", "");
        }
    },
    deleteUser: async (req, res) => {
        try {

            const { userID, groupID } = req.body

            const result = UserModel.deleteOne({ _id: userID })

            const resultRemove = GroupModel.updateOne(
                {
                    _id: groupID
                },
                {
                    "$pull": {
                        "member": { userID: userID }
                    }

                }
            )
            const resultAll = await Promise.all([result, resultRemove])

            if (resultAll[0].deletedCount !== 0 && resultAll[1].acknowledged) {
                res.customResponse(200, "Delete User Successful");
            }
            else {
                res.customResponse(400, "Delete User failed", "");
            }

        } catch (error) {
            res.status(500).json({ message: "Delete User Error" });
        }
    },

}

module.exports = UserController 