// The catchAsync function is a utility function used for handling asynchronous functions in an Express middleware.
// It simplifies the code by abstracting away the error handling logic for asynchronous functions.
// It takes an asynchronous function as a parameter and returns a new function that acts as a wrapper around the original function. (closure)

module.exports = (fn) => {
  // return a function, made from original async function that was passed in.
  // work through a closure
  return (req, res, next) => {
    fn(req, res, next).catch((err) => next(err));
  };
};

/*
  Example Usage:
  
  const asyncMiddleware = catchAsync(async (req, res, next) => {
    // Asynchronous code
  });

  In the above example, asyncMiddleware can be used as middleware in an Express route.
  Any errors that occur within the asynchronous code will be caught and passed to the error-handling middleware.


  1. It eliminates the need for explicit try-catch blocks: Normally, when working with asynchronous functions, you would need to wrap the function body in a try-catch block to catch any errors that occur. With catchAsync, you don't need to write the try-catch block yourself. The function automatically catches any errors thrown by the asynchronous function.
  2. It reduces code duplication: By providing a reusable utility function, catchAsync allows you to avoid duplicating error handling logic across multiple asynchronous middleware functions. You can simply wrap the asynchronous function with catchAsync to handle errors consistently.
  3. It promotes cleaner code organization: With catchAsync, the error handling logic is abstracted away from the main function body, improving the readability and maintainability of the code. The main function can focus on its core functionality, while error handling is delegated to the catchAsync wrapper.
*/
