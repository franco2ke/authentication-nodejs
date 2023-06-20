const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');

// Helper function 1: Create JWT token with user ID as payload
// JWT token used for STATELESS Login
const signToken = (id) => {
  return jwt.sign({ id: id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

// Helper function 2: Create and send JWT token to user
// Called by handler/controller function for both Sign Up verification and login
const createSendToken = (user, statusCode, res) => {
  console.time('JWT');
  // create JWT token
  const token = signToken(user._id);

  // Send JWT Securely in Read Only Cookie
  const cookieOptions = {
    expires: new Date(
      // cookie expires in 3h
      // Convert hours to TIMESTAMP format: milliseconds
      Date.now() + process.env.JWT_COOKIE_EXPIRES_IN * 60 * 60 * 1000
    ),
    // Send cookie only on encrypted connection (HTTPS), use in production
    // secure: true,
    // disable cookie from access and modification by browser, only receipt and sending
    httpOnly: true,
  };

  // Add secure cookie mode when the app is running in production
  // NOTE Browser automatically sends cookie with each request
  if (process.env.NODE_ENV === 'production') cookieOptions.secure = true;
  // Hide the user's password from the default res.body output when user is created on signup
  user.password = undefined;
  // Send JWT to browser via a cookie
  res.cookie('JWT', token, cookieOptions);
  // Determine the time taken to generate the token
  console.timeEnd('JWT');

  res.status(statusCode).json({
    status: 'success',
    data: {
      name: user.firstname,
      emai: user.email,
    },
  });
};

// A) Sign Up Handler
exports.signup = async (req, res, next) => {
  try {
    const newUser = await User.create({
      firstname: req.body.name,
      email: req.body.email,
      password: req.body.password,
      passwordConfirm: req.body.passwordConfirm,
    });

    // generate otp & save to database
    let otp = await newUser.createOTP();

    // email message
    const message = `Your authenticate OTP code is: ${otp}. Valid for 5 minutes`;
    // send otp to user email
    await sendEmail({
      email: newUser.email,
      subject: 'Authenticate: Your OTP, One-Time PassCode',
      message,
    });

    // send
    res.status(201).json({
      status: 'success',
      message: 'One-Time verification code sent to email',
    });

    // TODO send otp via email
  } catch (err) {
    // error caught by global handler so just forwarding is ok
    next(err);
  }
};

// B) Verify Account Handler
// verifies signup OTP & marks email as confirmed
exports.verify = async (req, res, next) => {
  try {
    // encrypt returned OTP and compare in DB
    const otp = crypto.createHash('sha256').update(req.body.otp).digest('hex');

    // check if user exists and otp has not expired
    // mongoDB will automatically convert the Date format for accurate comparison
    let user = await User.findOne({
      otpHashed: otp,
      email: req.body.email,
      otpExpires: { $gt: Date.now() },
    }).select(['-__v', '-phone']);

    // if user does not exist return error message in response
    if (!user) {
      return next(
        new AppError(
          'The otp is invalid or has expired, Login to get new one',
          400
        )
      );
    }
    // update account to active, and reset otp
    user.otpHashed = undefined;
    user.active = true;
    await user.save();
    // create and send login token to user; reset otpHashed
    createSendToken(user, 201, res);
  } catch (err) {
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
