const express = require('express');
const router = express.Router();

const MiddlewareController = require('../controllers/middleware');
const dataCoinByBitController = require('../controllers/dataCoinByBit');

router.get('/getAllStrategies', MiddlewareController.verifyToken, dataCoinByBitController.getAllStrategies);
router.get('/getAllSymbol', MiddlewareController.verifyToken, dataCoinByBitController.getAllSymbol);
router.get('/getAllSymbolWith24', MiddlewareController.verifyToken, dataCoinByBitController.getAllSymbolWith24);
router.get('/getFutureAvailable/:id', MiddlewareController.verifyToken, dataCoinByBitController.getFutureAvailable)
router.get('/getTotalFutureByBot/:id', MiddlewareController.verifyToken, dataCoinByBitController.getTotalFutureByBot)
router.get('/getSpotTotal/:id', MiddlewareController.verifyToken, dataCoinByBitController.getSpotTotal)

router.post('/createStrategies', MiddlewareController.verifyToken, dataCoinByBitController.createStrategies)

router.put('/updateStrategies/:id', MiddlewareController.verifyToken, dataCoinByBitController.updateStrategiesByID)
router.post('/updateStrategiesMultiple', MiddlewareController.verifyToken, dataCoinByBitController.updateStrategiesMultiple)

router.post('/deleteStrategiesItem', MiddlewareController.verifyToken, dataCoinByBitController.deleteStrategiesItem)
router.delete('/deleteStrategies/:id', MiddlewareController.verifyToken, dataCoinByBitController.deleteStrategies)
router.post('/deleteStrategiesMultiple', MiddlewareController.verifyToken, dataCoinByBitController.deleteStrategiesMultiple)

router.get('/syncSymbol', MiddlewareController.verifyToken, dataCoinByBitController.syncSymbol)
router.post('/copyMultipleStrategiesToSymbol', MiddlewareController.verifyToken, dataCoinByBitController.copyMultipleStrategiesToSymbol)
router.post('/copyMultipleStrategiesToBot', MiddlewareController.verifyToken, dataCoinByBitController.copyMultipleStrategiesToBot)
router.post('/balanceWallet', MiddlewareController.verifyToken, dataCoinByBitController.balanceWallet)
router.get('/getAllStrategiesActive', MiddlewareController.verifyToken, dataCoinByBitController.getAllStrategiesActive)


module.exports = router;
