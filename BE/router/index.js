const express = require('express');
const router = express.Router();

const botRouter = require('./bot.route');
const botTypeRouter = require('./botType.route');
const userRouter = require('./user.route');
const authRouter = require('./auth.route');
const dataCoinByBitRouter = require('./dataCoinByBit.route');
const roleRouter = require('./role.route');
const groupRouter = require('./group.route');
const positionRouter = require('./position.route');
const ltRouter = require('./lt.route');


router.use('/auth', authRouter);
router.use('/user', userRouter);
router.use('/bot', botRouter);
router.use('/botType', botTypeRouter);
router.use('/dataCoinByBit', dataCoinByBitRouter);
router.use('/role', roleRouter);
router.use('/group', groupRouter);
router.use('/position', positionRouter);
router.use('/lt', ltRouter);

// Sử dụng các route khác tương tự

module.exports = router;
