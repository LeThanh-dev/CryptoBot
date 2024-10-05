const express = require('express');
const router = express.Router();

const botRouter = require('./bot.route');
const botTypeRouter = require('./botType.route');
const userRouter = require('./user.route');
const authRouter = require('./auth.route');
const configByBitV3Router = require('./Configs/ByBit/V3/config.route');
const roleRouter = require('./role.route');
const groupRouter = require('./group.route');
const positionByBitV3Router = require('./Positions/ByBit/V3/position.route');
const positionByBitV1Router = require('./Positions/ByBit/V1/position.route');
const spotRouter = require('./Configs/ByBit/V1/spot.route');
const spotOKXRouter = require('./Configs/OKX/V1/spot.route');
const marginRouter = require('./Configs/ByBit/V1/margin.route');
const marginOKXRouter = require('./Configs/OKX/V1/margin.route');
const scannerByBitV1Router = require('./Configs/ByBit/V1/scanner.route');
const scannerOKXV1Router = require('./Configs/OKX/V1/scanner.route');
const scannerByBitV3Router = require('./Configs/ByBit/V3/scanner.route');
const coinRouter = require('./coin.route');
const instrumentByBitV1Router = require('./instruments/ByBit/V1/instrument.route');
const instrumentOKXV1Router = require('./instruments/OKX/V1/instrument.route');

router.use('/auth', authRouter);
router.use('/user', userRouter);
router.use('/bot', botRouter);
router.use('/botType', botTypeRouter);
router.use('/configByBitV3', configByBitV3Router);
router.use('/spot', spotRouter);
router.use('/spotOKX', spotOKXRouter);
router.use('/margin', marginRouter);
router.use('/marginOKX', marginOKXRouter);
router.use('/role', roleRouter);
router.use('/group', groupRouter);
router.use('/positionByBitV3', positionByBitV3Router);
router.use('/positionByBitV1', positionByBitV1Router);
router.use('/scannerByBitV1', scannerByBitV1Router);
router.use('/scannerOKXV1', scannerOKXV1Router);
router.use('/scannerByBitV3', scannerByBitV3Router);
router.use('/coin', coinRouter);
router.use('/instrumentByBitV1', instrumentByBitV1Router);
router.use('/instrumentOKXV1', instrumentOKXV1Router);

// Sử dụng các route khác tương tự

module.exports = router;
