const express = require('express');
const router = express.Router();

const MiddlewareController = require('../controllers/middleware');
const GroupController = require('../controllers/group');

router.get('/getAll', MiddlewareController.verifyToken, GroupController.getAll);
router.get('/getGroupByUserIDCreated/:id', MiddlewareController.verifyToken, GroupController.getGroupByUserIDCreated);
router.get('/getGroupByID/:id', MiddlewareController.verifyToken, GroupController.getGroupByID);
router.post('/create', MiddlewareController.verifyToken, GroupController.create);
router.put('/update/:id', MiddlewareController.verifyToken, GroupController.update);
router.post('/deleteMultiple', MiddlewareController.verifyToken, GroupController.deleteMultiple);

module.exports = router;
