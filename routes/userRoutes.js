const express = require('express');

// Create a router instance
const router = express.Router();

// placeholder response handler before implementation of custom functions
let sendDefaultResponse = (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      answer: 'Hello Authentication!',
    },
  });
};

// Authentication routes
router.post('/signup', sendDefaultResponse);
router.post('/login', sendDefaultResponse);
router.post('/mfa', sendDefaultResponse);
router.post('/forgotPassword', sendDefaultResponse);
router.patch('/resetPassword/:token', sendDefaultResponse);
router.patch('/updateMyPassword/:token', sendDefaultResponse);

// Current User routes
router.patch('/updateMe', sendDefaultResponse);
router.delete('/deleteMe', sendDefaultResponse);

// Admin User routes
// get all users, create a new user
router.route('/').get(sendDefaultResponse).post(sendDefaultResponse);
// get, update, delete, specific user
router
  .route('/:id')
  .get(sendDefaultResponse)
  .patch(sendDefaultResponse)
  .delete(sendDefaultResponse);

module.exports = router;
