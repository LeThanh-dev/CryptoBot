const express = require('express');
const router = express.Router();

const MiddlewareController = require('../../../../controllers/middleware');
const scannerController = require('../../../../controllers/Configs/OKX/V1/scanner');

router.get('/closeAllBotForUpCode', MiddlewareController.verifyToken, scannerController.closeAllBotForUpCode);

router.post('/getAllConfigScanner', MiddlewareController.verifyToken, scannerController.getAllConfigScanner);

router.post('/createConfigScanner', MiddlewareController.verifyToken, scannerController.createConfigScanner)
router.post('/updateStrategiesMultipleScanner', MiddlewareController.verifyToken, scannerController.updateStrategiesMultipleScanner)
router.post('/copyMultipleStrategiesToBotScanner', MiddlewareController.verifyToken, scannerController.copyMultipleStrategiesToBotScanner)

router.post('/deleteStrategiesByIDScanner', MiddlewareController.verifyToken, scannerController.deleteStrategiesByIDScanner)
router.post('/deleteStrategiesMultipleScanner', MiddlewareController.verifyToken, scannerController.deleteStrategiesMultipleScanner)
router.post('/updateConfigByID', MiddlewareController.verifyToken, scannerController.updateConfigByID)
router.post('/handleBookmarkScanner', MiddlewareController.verifyToken, scannerController.handleBookmarkScanner)
router.get('/syncSymbolScanner', MiddlewareController.verifyToken, scannerController.syncSymbolScanner)



module.exports = router;
