const express = require('express');
const router = express.Router();

const MiddlewareController = require('../controllers/middleware');
const UserController = require('../controllers/user');

router.get('/getAllUser', MiddlewareController.verifyToken, UserController.getAllUser);
router.get('/getAllUserWithoutGroup', MiddlewareController.verifyToken, UserController.getAllUserWithoutGroup);
router.get('/getUserByID/:userID', MiddlewareController.verifyToken, UserController.getUserByID);
router.post('/getAllUserByGroupID', MiddlewareController.verifyToken, UserController.getAllUserByGroupID);
router.post('/getAllUserByUserIDList', MiddlewareController.verifyToken, UserController.getAllUserByUserIDList);
router.post('/getAllUserByRoleName', MiddlewareController.verifyToken, UserController.getAllUserByRoleName);
router.post('/changePassword', MiddlewareController.verifyToken, UserController.changePassword);
router.post('/createNewUser', MiddlewareController.verifyToken, UserController.createNewUser);
router.post('/updateUser/:id', MiddlewareController.verifyToken, UserController.updateUser);
router.post('/deleteUser', MiddlewareController.verifyToken, UserController.deleteUser);

module.exports = router;
