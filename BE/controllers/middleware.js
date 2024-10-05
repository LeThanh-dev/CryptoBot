require('dotenv').config();
const jwt = require('jsonwebtoken');
const UserModel = require('../models/user.model')

const secretKey = process.env.JWT_SECRET_KEY;

const MiddlewareController = {
    // Tạo JWT token
    verifyToken: async (req, res, next) => {

        const token = req.headers.authorization;

        if (!token) {
            return res.customResponse(401, "Unauthorized", "");
        }

        // Xác thực token
        jwt.verify(token.split(' ')[1], secretKey, async (err, user) => {
            if (err) {
                return res.customResponse(403, "Your session has expired", "");
            }
            const result = await UserModel.findById(user._id)
            if (!result?.isActive) {
                return res.customResponse(401, "UserName Is Not Active", "");
            }
            req.user = user
            next();
        });

    },
}

module.exports = MiddlewareController 