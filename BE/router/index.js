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
const positionV1Router = require('./positionV1.route');
const spotRouter = require('./spot.route');
const spotOKXRouter = require('./spotOKX.route');
const marginRouter = require('./margin.route');
const marginOKXRouter = require('./marginOKX.route');
const scannerRouter = require('./scanner.route');
const scannerV3Router = require('./scannerV3.route');
const coinRouter = require('./coin.route');
const instrumentsInfoRouter = require('./instrumentsInfo.route');
const InstrumentOKXV1Router = require('./InstrumentOKXV1.route');

router.use('/auth', authRouter);
router.use('/user', userRouter);
router.use('/bot', botRouter);
router.use('/botType', botTypeRouter);
router.use('/dataCoinByBit', dataCoinByBitRouter);
router.use('/spot', spotRouter);
router.use('/spotOKX', spotOKXRouter);
router.use('/margin', marginRouter);
router.use('/marginOKX', marginOKXRouter);
router.use('/role', roleRouter);
router.use('/group', groupRouter);
router.use('/position', positionRouter);
router.use('/positionV1', positionV1Router);
router.use('/scanner', scannerRouter);
router.use('/scannerV3', scannerV3Router);
router.use('/coin', coinRouter);
router.use('/instrumentsInfo', instrumentsInfoRouter);
router.use('/InstrumentOKXV1', InstrumentOKXV1Router);

// Sử dụng các route khác tương tự

module.exports = router;
