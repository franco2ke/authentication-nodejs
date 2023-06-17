const dotenv = require('dotenv');
const mongoose = require('mongoose');
// Local packages
const app = require('./app');

// ERROR HANDLING: Managed here to ensure no errors go unhandled
// Adds event handler to the process object
// UNCAUGHT EXCEPTIONS caused by Synchronous Errors
process.on('uncaughtException', (err) => {
  console.log('🚩 UNCAUGHT ERROR! * SHUTTING DOWN 🚩');
  console.log(err);
  // Attempt to gracefully shut down process by allowing timed for pending requests
  process.exit(1);
});

// UNHANDLED REJECTIONS: Handle unhandled promise rejections to ensure no errors are missed
// process object emits 'unhandledRejection' event on any unhandled rejection
process.on('unhandledRejection', (err) => {
  console.log('🚩 UNHANDLED ASYNCHRONOUS ERROR! * SHUTTING DOWN 🚩');
  console.log(err);
  // Attempt to gracefully shut down server and process
  server.close(() => {
    process.exit(1);
  });
});

// Load environment variables from the config.env file
// Do this before loading app / webserver object
dotenv.config({ path: './config.env' });

// Log the current environment (Production / Development)
console.log(
  `\nWebserver running in ${process.env.NODE_ENV.toUpperCase()} environment\n`
);

// Connect to Database per environment
// Generate Database connect string, replace <PASSWORD> placeholder
let DB;
if (process.env.NODE_ENV === 'production') {
  DB = process.env.DATABASE_PRODUCTION.replace(
    '<PASSWORD>',
    process.env.DATABASE_PASSWORD
  );
} else {
  DB = process.env.DATABASE_LOCAL;
}

mongoose
  .connect(DB, {
    // Avoid deprecation warnings
    useNewUrlParser: true,
  })
  .then((con) => {
    // If connection is successful, print connection details
    console.log('DB connection successful 🎲 ');
    console.log(`Host: ${con.connection.host}`);
    console.log(`Database: ${con.connection.name}`);
  })
  .catch((err) => {
    // If connection fails, handle the error and exit the process
    console.log('ERROR - DB Connection Failure');
    console.log(err);
    process.exit(1);
  });

// Set the web server port from the environment variable or use the default (8000)
const port = process.env.PORT || 8000;

// Start the web server and listen for incoming requests
const server = app.listen(port, () => {
  console.log(`App running on port ${port}....\n`);
});

// Uncomment line to test uncaught exception error handling
// console.log(x);

/* 
The code above performs the following key actions:

1. Imports necessary modules:
   - `mongoose` for connecting to a MongoDB database.
   - `dotenv` for loading environment variables from a configuration file.

2. Handles uncaught exceptions:
   - The code sets up an event listener for the `uncaughtException` event. If an unhandled exception occurs, it logs an error message, shuts down the process, and exits with an error code.

3. Handles unhandled rejections:
   - The code sets up an event listener for the `unhandledRejection` event. If a promise rejection goes unhandled, it logs an error message, shuts down the server gracefully by closing it, and exits with an error code.

4. Loads environment variables:
   - The code uses `dotenv` to load environment variables from a configuration file (`config.env`) and saves them to the `process.env` object, making them accessible throughout the application.

5. Imports the application module:
   - The code imports the main application module from `./app`.

6. Connects to the database:
   - The code replaces a placeholder `<PASSWORD>` in the database connection string (`process.env.DATABASE`) with the actual database password from the environment variables.
   - It then uses `mongoose` to connect to the MongoDB database specified by the connection string.
   - If the connection is successful, it prints a success message with the host and database information.

7. Sets up the web server:
   - The code sets the `port` variable to either the value of the `PORT` environment variable or 8000 if the `PORT` variable is not set.
   - It starts the web server by calling the `listen` method on the `app` module, passing the `port` variable. It also logs a message indicating the server is running.

8. Uncommented code:
   - The last line of the code is commented out, so it doesn't have any effect. It is a test line that would cause an uncaught exception if uncommented (`console.log(x)`).

NOTE: Overall, the code loads environment variables, connects to a database, sets up the web server, and handles errors related to exceptions and promise rejections to ensure the application runs smoothly and is gracefully shut down when necessary.
*/
