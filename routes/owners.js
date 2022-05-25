'use strict';

const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config()
const jwt = require('express-jwt');
const jwksRsa = require('jwks-rsa');
const response = require('../utility/response'); // response message
const model = require('../models/model-datastore'); // datastore class
const errors = require('../utility/errors'); // error handling

const router = express.Router();

// Automatically parse request body as JSON
router.use(bodyParser.json({}));

// Checks for valid jwt
const checkJwt = jwt({
    secret: jwksRsa.expressJwtSecret({
      cache: true,
      rateLimit: true,
      jwksRequestsPerMinute: 5,
      jwksUri: `https://${process.env.DOMAIN}/.well-known/jwks.json`
    }),
    // Validate the audience and the issuer.
    issuer: `https://${process.env.DOMAIN}/`,
    algorithms: ['RS256']
  });


/**
 * GET /owners/:owner_id/boats
 *
 * List all the boats for owner
 */
  router.get('/:owner_id/boats', checkJwt, async (req, res, next) => {
    // Set owner 
    let owner = req.params.owner_id;

    // If owner is accessing their boats, display all
    if (owner === req.user.sub) {
      model.RetrieveOwners('boat', owner, false)
      .then((result) => {
        // if boats, send response
        if (result[0]){

          // Loop through response, add id from datastore to response
          for (let index = 0; index < result[0].length; index++) {
            const objsymbol = Object.getOwnPropertySymbols(result[0][index])
            let boat_id =parseInt(result[0][index][objsymbol[0]].id)
            result[0][index]['id'] = boat_id;
          }

        // send response
        response.sendResponse(res, result[0], 200);
        } 
        else { // no boats for user, send empty list
            response.sendResponse(res, [], 200);
        }
    })
    // handle error
    .catch((error) => {
      next(error);
    });
    }
    // non owner accessing other owners boats, only display public
    else{
      model.RetrieveOwners('boat', owner, true)
      .then((result) => {
        // if boats, send response
        if (result[0]){
            response.sendResponse(res, result[0], 200);
        } else { // no boats for user, send empty list
            response.sendResponse(res, [], 200);
        }
    })
    // handle error
    .catch((error) => {
      next(error);
    });
    }

    // res.send('test')
  });

  /**
 * Errors on "/*" routes.
 */
router.use((err, req, res, next) => {

  // Delete//Post invalid token
  if (err.name === "UnauthorizedError") {
    let owner = req.path.slice(1, -6);
    model.RetrieveOwners('boat', owner, true)
    .then((result) => {
      // if boats, send response
      if (result[0]){

          // Loop through response, add id from datastore to response
        for (let index = 0; index < result[0].length; index++) {
          const objsymbol = Object.getOwnPropertySymbols(result[0][index])
          let boat_id =parseInt(result[0][index][objsymbol[0]].id)
          result[0][index]['id'] = boat_id;
        }

          response.sendResponse(res, result[0], 200);
      } else { // no boats for user, send empty list
          response.sendResponse(res, [], 200);
      }
  })
  }
});


  module.exports = router;