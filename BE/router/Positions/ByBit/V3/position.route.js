const express = require('express');
const router = express.Router();

const MiddlewareController = require('../../../../controllers/middleware');
const PositionController = require('../../../../controllers/Positions/ByBit/V3/position');

router.post('/getPriceLimitCurrent', MiddlewareController.verifyToken, PositionController.getPriceLimitCurrent);
router.post('/getAllPosition', MiddlewareController.verifyToken, PositionController.getAllPosition);
router.post('/updatePL', MiddlewareController.verifyToken, PositionController.updatePL);
router.post('/closeMarket', MiddlewareController.verifyToken, PositionController.closeMarket);
router.post('/closeLimit', MiddlewareController.verifyToken, PositionController.closeLimit);
router.post('/closeAllPosition', MiddlewareController.verifyToken, PositionController.closeAllPosition);

module.exports = router;