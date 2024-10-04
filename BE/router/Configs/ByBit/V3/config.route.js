const express = require('express');
const router = express.Router();

const MiddlewareController = require('../../../../controllers/middleware');
const dataCoinByBitController = require('../../../../controllers/Configs/ByBit/V3/config');

router.get('/closeAllBotForUpCode', MiddlewareController.verifyToken, dataCoinByBitController.closeAllBotForUpCode);
router.post('/getAllStrategies', MiddlewareController.verifyToken, dataCoinByBitController.getAllStrategies);
router.get('/getAllSymbol', MiddlewareController.verifyToken, dataCoinByBitController.getAllSymbol);
router.get('/getFutureAvailable/:id', MiddlewareController.verifyToken, dataCoinByBitController.getFutureAvailable)
router.get('/getTotalFutureByBot/:id', MiddlewareController.verifyToken, dataCoinByBitController.getTotalFutureByBot)
router.get('/getTotalFutureSpot/:id', MiddlewareController.verifyToken, dataCoinByBitController.getTotalFutureSpot)
router.get('/getSpotTotal/:id', MiddlewareController.verifyToken, dataCoinByBitController.getSpotTotal)

router.post('/createStrategies', MiddlewareController.verifyToken, dataCoinByBitController.createStrategies)
router.post('/getTotalFutureSpotByBot', MiddlewareController.verifyToken, dataCoinByBitController.getTotalFutureSpotByBot)

router.put('/updateStrategies/:id', MiddlewareController.verifyToken, dataCoinByBitController.updateStrategiesByID)
router.post('/updateStrategiesMultiple', MiddlewareController.verifyToken, dataCoinByBitController.updateStrategiesMultiple)
router.put('/addToBookmark/:id', MiddlewareController.verifyToken, dataCoinByBitController.addToBookmark)
router.put('/removeToBookmark/:id', MiddlewareController.verifyToken, dataCoinByBitController.removeToBookmark)

router.post('/deleteStrategiesItem', MiddlewareController.verifyToken, dataCoinByBitController.deleteStrategiesItem)
router.post('/deleteStrategies/:id', MiddlewareController.verifyToken, dataCoinByBitController.deleteStrategies)
router.post('/deleteStrategiesMultiple', MiddlewareController.verifyToken, dataCoinByBitController.deleteStrategiesMultiple)

router.get('/syncSymbol', MiddlewareController.verifyToken, dataCoinByBitController.syncSymbol)
router.post('/copyMultipleStrategiesToSymbol', MiddlewareController.verifyToken, dataCoinByBitController.copyMultipleStrategiesToSymbol)
router.post('/copyMultipleStrategiesToBot', MiddlewareController.verifyToken, dataCoinByBitController.copyMultipleStrategiesToBot)
router.post('/balanceWallet', MiddlewareController.verifyToken, dataCoinByBitController.balanceWallet)
router.get('/getAllStrategiesActive', MiddlewareController.verifyToken, dataCoinByBitController.getAllStrategiesActive)


module.exports = router;
