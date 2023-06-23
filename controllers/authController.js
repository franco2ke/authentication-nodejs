const crypto = require('crypto');
const { promisify } = require('util'); // promisify method
const jwt = require('jsonwebtoken');
const User = require('../models/userModel');
const AppError = require('../utils/appError');
const sendEmail = require('../utils/email');
const catchAsync = require('../utils/catchAsync');
const { read } = require('fs');

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
      email: user.email,
    },
  });
};

// A) Sign Up Handler
exports.signup = catchAsync(async (req, res, next) => {
  const newUser = await User.create({
    firstname: req.body.name,
    email: req.body.email,
    password: req.body.password,
    passwordConfirm: req.body.passwordConfirm,
  });

  // generate otp & save to database
  let otp = await newUser.createOTP();

  // email message
  const message = `Your authenticate one time passcode is: ${otp}. Valid for ${process.env.OTP_EXPIRES_IN} minutes`;
  // send otp to user email
  await sendEmail({
    email: newUser.email,
    subject: 'authenticate: Your sign up one time passcode',
    message,
  });

  // send
  res.status(201).json({
    status: 'success',
    message: `Sign up OTP, one time passcode  sent to ${newUser.email}`,
  });
});

// B) Verify Account Handler
// verifies signup & Login OTP & marks email as confirmed
exports.verify = catchAsync(async (req, res, next) => {
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
});

// C) User Login Handler
exports.login = catchAsync(async (req, res, next) => {
  // get email and password credentials from request body
  const { email, password } = req.body;

  // 1) Check if email and password exist in request body
  if (!email || !password) {
    return next(new AppError('Please provide email and password!', 400));
  }

  // 2) Retrieve user from database
  // return user document and include hidden 'password' field: select('+password')
  const user = await User.findOne({ email: email }).select('+password');

  // 3) Check if user exists & Compare submitted password and stored password
  // instance method used; throw error if user does not exist
  if (!user || !(await user.correctPassword(password, user.password))) {
    return next(new AppError('Incorrect email or password', 401));
  }

  // 4) If everything ok, Generate OTP and send to client / user email
  let otp = await user.createOTP();

  // email message
  const message = `Your authenticate one time passcode is: ${otp}. Valid for ${process.env.OTP_EXPIRES_IN} minutes`;
  // send otp to user email
  await sendEmail({
    email: user.email,
    subject: 'authenticate: Your login one time passcode',
    message,
  });

  // 5) return response to user
  res.status(201).json({
    status: 'success',
    message: `one time login passcode sent to ${user.email}`,
  });
});

// D) Default placeholder handler before implementation of custom functions
exports.sendDefaultResponse = (req, res) => {
  res.status(200).json({
    status: 'success',
    data: {
      answer: 'hello',
    },
  });
};

// D) User Login verification Handler
exports.protect = catchAsync(async (req, res, next) => {
  // 1) Get token and check if it actually exists
  let token;
  // NOTE express turns all request.body header keys to lowercase
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    // separate token string out from header string
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return next(
      new AppError('You are not logged in! Please log in to get access.', 401)
    );
  }

  // 2) Verify Token has not expired and its signature is valid (jwt.verify())
  // promisify needed because jwt.verify takes a callback to run asynchronously
  const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
  // handle JSONTokenError & TokenExpiredError in Global Error Controller
  // view decoded payload
  console.log(decoded);

  // 3) Check if user exists and LOAD user
  const currentUser = await User.findById(decoded.id);
  // Generate error if user not found in DB
  if (!currentUser) {
    return next(
      new AppError('The user belonging to this token no longer exists.', 401)
    );
  }

  // 4) Check if user changed password after the token was issued (Security Measure)
  // iat: issued at time
  if (currentUser.changedPasswordAfter(decoded.iat)) {
    return next(
      new AppError('User recently changed password! Please log in again.', 401)
    );
  }

  // Grant access to protected route
  // NOTE: add user data to request object for use in next middleware
  req.user = currentUser;
  next();
});
