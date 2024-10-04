const express = require('express');
const router = express.Router();

const MiddlewareController = require('../../../../controllers/middleware');
const instrumentsInfoController = require('../../../../controllers/instruments/ByBit/V1/instrument');

router.get('/getAll', MiddlewareController.verifyToken, instrumentsInfoController.getAll);
router.get('/sync', MiddlewareController.verifyToken, instrumentsInfoController.sync)

module.exports = router;
