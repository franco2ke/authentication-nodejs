// Import required packages
const express = require('express');
// Create webserver object with express related methods and properties
const app = express();

// Create routing middleware
app.get('/api/v1/users', (req, res) => {
  res.send('Hello Authentication!');
});

module.exports = app;
