const User = require('../models/userModel');
// Helper function 1: Create and send activation code OTP
// Called by a handler/controller function for both signup and login

// A) Sign Up Handler
exports.signup = async (req, res, next) => {
  try {
    const newUser = await User.create({
      firstname: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
    });

    // Generate otp & save to database
    let otp = newUser.createOTP();
    // TODO send otp via email

    res.status(201).json({
      status: 'success',
      data: {
        newUser,
      },
    });
  } catch (err) {
    // error caught by global handler so just forwarding is ok
    next(err);
  }
};

// B) Default placeholder handler before implementation of custom functions
exports.sendDefaultResponse = (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      answer: 'hello',
    },
  });
};
