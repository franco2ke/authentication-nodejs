// Import required packages
const express = require('express'); // Express framework for web server functionality
const morgan = require('morgan'); // HTTP request logging middleware
const helmet = require('helmet'); // Security HTTP headers
const rateLimit = require('express-rate-limit'); // Limit requests from one IP
const mongoSanitize = require('express-mongo-sanitize'); // Prevent NoSQL query injection
const xss = require('xss-clean'); // Prevent cross-site scripting attacks
const hpp = require('hpp'); // Prevent parameter pollution

// Import local modules
const AppError = require('./utils/appError');

// Import routers as middleware for mounting on the app object
const userRouter = require('./routes/userRoutes');

// Create webserver object with express related methods and properties
const app = express();

// GLOBAL MIDDLEWARES
// Code with access to the web requests and responses, that manipulate the data
// They run on the req, res objects in the order their lexical order

// 1) LOGGING MIDDLEWARE: Enable logging only in development mode, to not share too much info in production
if (process.env.NODE_ENV === 'development') {
  // Log HTTP requests to console as per morgan's 'dev' configuration
  // dev config -> :method :url :status :response-time ms - :res[content-length] in bytes
  app.use(morgan('dev'));
}

// 2) BODY PARSER MIDDLEWARE
// express.json() parses incoming requests with JSON payloads (request.body);
// It reads data from actual request and creates a new request.body object containing the parsed data.
// reject parsing of request bodies greater than 10kb.
app.use(express.json({ limit: '10kb' }));

// 3) SECURITY MIDDLEWARE: Middleware to make it harder to attack / exploit webserver

// a) SECURE HTTP Headers
// safeguard HTTP headers returned by the Node.js app that expose sensitive information
app.use(helmet());

// b) Add IP RATE LIMITING
// Limit number of request from same IP in a given amount of time
const limiter = rateLimit({
  // Allow maximum of 100 requests from an IP in 1 hour.
  max: 100,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});
// If app crashes, limit resets
app.use('/api', limiter);
// Creates new headers on ther response

// c) DATA SANITIZATION against NoSQL query injection
// filters all $ signs and (.) dots from request body,query and params --> "email": {"$gt": ""}
app.use(mongoSanitize());

// d) DATA SANITIZATION against XSS
// Remove malicious html or js code from user input data
// FIXME Deprecated, explore other options
app.use(xss());

// e) Prevent PARAMETER POLLUTION
// Delete and prevent errors due to duplicate req.query/req.body fields, except in whitelisted cases
// e.g. GET /search?firstname=Francis&firstname=Francis
// body must have already been parsed
app.use(
  hpp({
    whiteList: ['example'],
  })
);

// 4) CUSTOM MIDDLEWARE

// a) Display request info on console
app.use((req, res, next) => {
  console.log('---😎----------------------------------------');

  // log req.query values if present
  if (Object.keys(req.query).length !== 0)
    console.log(`url/? -> query values`, req.query);

  next();
});

// b) Add request time to request object
// allows calculation of response time
app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

//  5) ROUTING MIDDLEWARE: Define API URL routes

app.use('/api/v1/users', userRouter); // Mount user router

// Catch all route for handling ALL unrecognized / non existent routes
app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
  next();
});

// ERROR HANDLING MIDDLEWARE
// TODO create the global error handler for operational errors during request, response cycle

module.exports = app;
