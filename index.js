const dotenv = require('dotenv');
const mongoose = require('mongoose');
// Local packages
const app = require('./app');

// Load environment variables from the config.env file
// Do this before loading app / webserver object
dotenv.config({ path: './config.env' });

// Log the current environment (Production / Development)
console.log(
  `\nWebserver running in ${process.env.NODE_ENV.toUpperCase()} environment\n`
);

// console.log(process.env.NODE_ENV === 'production');

// Connect to Database per environment
// Generate Database connect string
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
