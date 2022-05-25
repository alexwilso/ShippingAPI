"use strict";

const express = require('express');

const app = express();
app.set('trust proxy', true);

app.disable('etag');
const boats = require('./routes/boats');
const loads = require('./routes/loads');

// use the boats.js file to handle endpoints that start with /boats
app.use('/boats', boats);

// use the loads.js file to handle endpoints that start with /loads
app.use('/loads', loads); 

// Home
app.get('/', (req, res) => {
  res.send('Endpoints: /boats, /loads');
});

// Basic 404 handler
app.use((req, res) => {
  res.status(404).send('Not Found');
});

// Basic error handler
app.use((err, req, res, next) => {
  /* jshint unused:false */
  console.error(err);
  // If our routes specified a specific response, then send that. Otherwise,
  // send a generic message so as not to leak anything.
  res.status(500).send(err.response || 'Something broke!');
});

// Start the server
const PORT = parseInt(process.env.PORT) || 8080;
app.listen(PORT, () => {
console.log(`App listening on port ${PORT}`);
console.log('Press Ctrl+C to quit.');
});

module.exports = app;