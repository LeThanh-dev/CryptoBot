// const { ObjectId } = require('mongodb');
const RoleModel = require('../models/role.model');

const RoleController = {

    getByRoleName: async (req, res) => {
        try {
            const roleName = req.params.roleName;
            const data = await RoleModel.findOne({ name: roleName })
            res.customResponse(res.statusCode, "Get Role Successful", data);

        } catch (err) {
            res.status(500).json({ message: err.message });
        }
    },
    initCreate: async () => {
        try {

            const TraderRole = {
                list: []
            }
            const ManagerTraderRole = {
                list: [
                    ...TraderRole.list,
                    "Users"
                ]
            }
            const AdminRole = {
                list: [
                    ...ManagerTraderRole.list,
                    "Groups"
                ]
            }
            const SuperAdminRole = {
                list: [
                    ...AdminRole.list,
                    "BotTypes",
                ]
            }

            const roleList = [
                {
                    name: "SuperAdmin",
                    list: SuperAdminRole.list
                },
                {
                    name: "Admin",
                    list: AdminRole.list
                },
                {
                    name: "ManagerTrader",
                    list: ManagerTraderRole.list
                },
                {
                    name: "Trader",
                    list: TraderRole.list
                },
            ]
            const newData = roleList.map(role => ({
                name: role.name,
                roleList: role.list
            }))

            await RoleModel.insertMany(newData)
            console.log("\n[V] Initialization Role Successful");

        } catch (error) {
            // Xử lý lỗi nếu có
            console.log("\n[!] Initialization Role Error:\n", error.message);
        }
    },

    addMore: async () => {
        try {
            await RoleModel.updateMany(
                { name: { $in: ["SuperAdmin"] } },
                {
                    "$addToSet": {
                        roleList: [
                            "Configs/ByBit/V3/Scanner",
                            "Configs/ByBit/V1",
                            "Configs/ByBit/V1/Spot",
                            "Configs/ByBit/V1/Margin",
                            "Configs/ByBit/V1/Scanner",
                            "Configs/OKX",
                            "Configs/OKX/V3",
                            "Configs/OKX/V3/Config",
                            "Configs/OKX/V3/Scanner",
                            "Configs/OKX/V1",
                            "Configs/OKX/V1/Spot",
                            "Configs/OKX/V1/Margin",
                            "Configs/OKX/V1/Scanner",
                            "Positions/ByBit/V1",
                            "Positions/OKX",
                            "Positions/OKX/V3",
                            "Positions/OKX/V1",
                        ]
                    }
                },
            );

            console.log("\n[V] Add More Role Successful");

        } catch (err) {
            console.log("\n[!] Add More Role Error:\n", err.message);
        }
    }

}

module.exports = RoleController 