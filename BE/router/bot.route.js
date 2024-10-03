const express = require('express');
const router = express.Router();

const MiddlewareController = require('../controllers/middleware');
const BotController = require('../controllers/bot');

router.get('/getAllBot', MiddlewareController.verifyToken, BotController.getAllBot);
router.get('/getAllBotActive', MiddlewareController.verifyToken, BotController.getAllBotActive);
router.get('/getAllBotByUserID/:id', MiddlewareController.verifyToken, BotController.getAllBotByUserID);
router.get('/getAllBotActiveByUserID/:id', MiddlewareController.verifyToken, BotController.getAllBotActiveByUserID);
router.get('/getAllBotOnlyApiKeyByUserID/:id', MiddlewareController.verifyToken, BotController.getAllBotOnlyApiKeyByUserID);
router.get('/getAllBotBySameGroup/:id', MiddlewareController.verifyToken, BotController.getAllBotBySameGroup);
router.get('/:id', MiddlewareController.verifyToken, BotController.getByID);
router.post('/getAllBotByGroupCreatedByUserID', MiddlewareController.verifyToken, BotController.getAllBotByGroupCreatedByUserID);

router.post('/', MiddlewareController.verifyToken, BotController.createBot);
router.put('/:id', MiddlewareController.verifyToken, BotController.updateBot);
router.post('/setMargin', MiddlewareController.verifyToken, BotController.setMargin);
router.post('/setLever', MiddlewareController.verifyToken, BotController.setLever);

router.delete('/:id', MiddlewareController.verifyToken, BotController.deleteBot);

router.post('/deleteMultipleBot', MiddlewareController.verifyToken, BotController.deleteMultipleBot);


module.exports = router;
