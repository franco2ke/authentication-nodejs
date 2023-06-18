// Custom Error Class for handling application specific / operational errors
// The `AppError` class extends the built-in `Error` class.
// Add's 4 extra fields to default error object for a total of 5 important fields:
// 1. error.statusCode,
// 2. error.status
// 3. error.isOperational
// 4. error.message
// 5. error.stack

class AppError extends Error {
  /**
   * Create a new instance of AppError.
   * @param {string} message - The error message.
   * @param {number} statusCode - The HTTP status code for the error.
   */

  constructor(message, statusCode) {
    // Call the parent class constructor (Error) to set the error message, set this variable
    super(message);

    // Set the HTTP status code and status based on the provided status code
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';

    // Indicate that this error is operational / caused by a user and unique to our application
    // & that we are handling it in a user friendly way
    this.isOperational = true;

    // Capture the stack trace and assign it to the 'stack' property of this error object
    // returns a string representing the location in the code at which Error.captureStackTrace() was called.
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = AppError;
