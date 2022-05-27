'use strict';
require('dotenv').config();
// Set up router
const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
router.use(bodyParser.json({}));
// Token validation
const jwt = require('express-jwt');
const jwksRsa = require('jwks-rsa');
// Error Handeling
const errors = require('../errors/utility_errors');
const ownerErrors = require('../errors/owner_errors');
// Client Response
const response = require('../utility/response');
const ownerHelpers = require('../helpers/owner_helpers');
// datastore model
const model = require('../models/model-datastore');


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
   * Post /owners
   * 
   * Create a new owner
   */
  router.post('/', checkJwt, async (req, res, err) => {
    // Add email and sub to body
    req.body.email = req.user.name;
    req.body.sub = req.user.sub;

    // Make a list of owners
    let ownersList = await model.RetrieveList('owners', req)
      .then((owners) => {
        return owners[0];
      });

    // Check if owner already exist
    if(ownerErrors.checkExist(res, ownersList, req.body.sub)){
      return
    }

    // Add Owner
    ownerHelpers.insertOwner(req, res);
  });

  /**
 * Get /owners
 * 
 * Gets a list of all owners
 */
router.get('/', checkJwt, async (req, res, next) => {

  // Returns a list of all owners
  model.RetrieveList('owners', req)
    .then((result) => {
          // if owners, send response
          if (result[0]){

            // Loop through response, add id from datastore to response
            for (let index = 0; index < result[0].length; index++) {
                const objsymbol = Object.getOwnPropertySymbols(result[0][index])
                let owner_id =parseInt(result[0][index][objsymbol[0]].id)
                result[0][index]['id'] = owner_id;
                // Remove boats attribute
                delete result[0][index]['boats'];
                // Rename sub attribute
                result[0][index]['owner'] = result[0][index]['sub']
                delete result[0][index]['sub'];
            }
            // Send response
            response.sendResponse(res, result[0], 200);

        } else { // no owners, send empty list
            response.sendResponse(res, [], 200);
        }
    })
    .catch((err) => {
      next(err);
    });
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
      model.RetrieveBoatsByOwner('boat', owner, false)
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

    if (req.method == "POST" || req.method == "GET") {
      ownerErrors.postError(res);
      return;
      
    } else {
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
  }
});
  module.exports = router;