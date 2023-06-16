const dotenv = require('dotenv');
const app = require('./app');

// Load environment variables from the config.env file
// Do this before loading app / webserver object
dotenv.config({ path: './config.env' });

// Log the current environment (Production / Development)
console.log(
  `\nWebserver running in ${process.env.NODE_ENV.toUpperCase()} environment\n`
);

// Set the web server port from the environment variable or use the default (8000)
const port = process.env.PORT || 8000;

// Start the web server and listen for incoming requests
const server = app.listen(port, () => {
  console.log(`App running on port ${port}....\n`);
});
