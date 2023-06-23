// Import the custom error module
const AppError = require('../utils/appError');

// Handle Duplicate Field errors
const handleDuplicateFieldsDB = (err) => {
  // Retrieve duplicate field name & value
  // const fieldKeyValue = err.errmsg.match(/(["'])(?:(?=(\\?))\2.)*?\1/)[0];
  const fieldKeyValue = Object.entries(err.keyValue);
  const message = `Duplicate field, ${fieldKeyValue[0][0]}: ${fieldKeyValue[0][1]}. Please use another value!`;

  return new AppError(message, 400);
};

// Send error response in the development environment with full details
const sendErrorDev = (err, res) => {
  res.status(err.statusCode).json({
    status: err.status,
    error: err,
    message: err.message,
    stack: err.stack,
  });
};

// Send error response in production with necessary details only
// Hide information from bad actors
// Send error response in the production environment
const sendErrorProd = (err, res) => {
  if (err.isOperational) {
    // For operational errors, send error message to users
    // Guide user on how to fix the error
    res.status(err.statusCode).json({
      status: err.status,
      message: err.message,
    });
  } else {
    // For programming or unknown errors, don't leak details to users
    console.error('ERROR 💥', err); // Log the error
    res.status(500).json({
      status: 'error',
      error: 'Something went very wrong',
    }); // Send a generic error response
  }
};

// Handle Invalid JWT Error
const handleJWTError = () =>
  new AppError('Invalid token, Please log in again!', 401);

// Handle Expired JWT Error
const handleJWTExpiredError = () =>
  new AppError('Expired token, Please log in again!', 401);

// Error handling middleware
module.exports = (err, req, res, next) => {
  err.statusCode = err.statusCode || 500; // Set the status code to 500 if not already set
  err.status = err.status || 'error'; // Set the status to 'error' if not already set

  if (process.env.NODE_ENV === 'development') {
    // Send detailed error response ONLY in development environment
    sendErrorDev(err, res);
  } else if (process.env.NODE_ENV === 'production') {
    // Create a new copy of error object to avoid modifying the original error
    let error = Object.create(err);
    // Destructuring and Object.assign do not copy all the error properties;
    // error.name & error.message which are on the prototype of the AppError are not copied.
    // they are in the prototype (Mongoose update) --> super(message)
    // let error = { ...err };
    // let error = Object.assign({},err);
    // let error = JSON.parse(JSON.stringify(err)); //NOTE <-- This works for whatever reason

    // TODO Handle Custom errors here
    // Handle Duplicate Key error: (post duplicate item) code: 11000
    if (err.code === 11000) error = handleDuplicateFieldsDB(err);
    // Handle Invalid JWT login token
    if (error.name === 'JsonWebTokenError') error = handleJWTError();
    // Handle Expired JWT login token
    if (error.name === 'TokenExpiredError') error = handleJWTExpiredError();

    sendErrorProd(error, res);
  }
};
