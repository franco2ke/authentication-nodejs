const express = require('express');
const authController = require('../controllers/authController');

// Create a router instance
const router = express.Router();

// Authentication routes
router.post('/signup', authController.signup);
router.post('/verify', authController.verify);
router.post('/login', authController.sendDefaultResponse);
router.post('/mfa', authController.sendDefaultResponse);
router.post('/forgotPassword', authController.sendDefaultResponse);
router.patch('/resetPassword/:token', authController.sendDefaultResponse);
router.patch('/updateMyPassword/:token', authController.sendDefaultResponse);

// Current User routes
router.patch('/updateMe', authController.sendDefaultResponse);
router.delete('/deleteMe', authController.sendDefaultResponse);

// Admin User routes
// get all users, create a new user
router
  .route('/')
  .get(authController.sendDefaultResponse)
  .post(authController.sendDefaultResponse);
// get, update, delete, specific user
router
  .route('/:id')
  .get(authController.sendDefaultResponse)
  .patch(authController.sendDefaultResponse)
  .delete(authController.sendDefaultResponse);

module.exports = router;
