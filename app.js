"use strict";

const helpers = require("./public/helpers/helperObj.js").obj; // helper functions

const express = require('express');
const { auth, requiresAuth } = require('express-openid-connect');
const app = express();

 // Set up handlebars
 let handlebars = require("express-handlebars").create({
	defaultLayout:"main",
	helpers: helpers
});

app.disable('etag');
app.engine("handlebars", handlebars.engine);
app.set("view engine", "handlebars");
app.set('views', './views');
app.set('trust proxy', true);

// Sets static directory to public
app.use(express.static('public'));

const boats = require('./routes/boats');
const loads = require('./routes/loads');
const owners = require('./routes/owners')

const config = {
  authRequired: false,
  auth0Logout: true,
  baseURL: 'http://localhost:8080',
  clientID: 'zXpGZx4XQXhHODRnIlgbBWfnbL57sKEZ',
  issuerBaseURL: `https://wilsoal9-493.us.auth0.com`,
  secret: 'MqUYLNLiBQ5N6IgQCCQ05TNn1axAF-koX-99AgtPZ61pa-1bNOIXoXProHcTuKSf'
};

// auth router attaches /login, /logout, and /callback routes to the baseURL
app.use(auth(config));

// use the boats.js file to handle endpoints that start with /boats
app.use('/boats', boats);

// use the loads.js file to handle endpoints that start with /loads
app.use('/loads', loads); 

// use the owners.js file to handle endpoints that start with /owners
app.use('/owners', owners); 

// Home
app.get('/', (req, res) => {
  let context = {};
  context['login'] = req.oidc.isAuthenticated() ? 'Logged in' : 'Logged out';
  context['token'] = req.oidc.idToken;
  res.render('index', context);
});

// Send user
app.get('/user', requiresAuth(), (req, res) => {
  res.send(JSON.stringify(req.oidc.user))
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