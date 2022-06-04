'use strict';

// Set up router
const express = require('express');
const bodyParser = require('body-parser');
const router = express.Router();
router.use(bodyParser.json({}));
// Token validation
const jwt = require('express-jwt');
const jwksRsa = require('jwks-rsa');
// datastore model
const model = require('../models/model-datastore');
// error handeling
const errors = require('../errors/utility_errors');
const ownerErrors = require('../errors/owner_errors');
// Client Response
const response = require('../utility/response');
// helpers
const load_helper = require('../helpers/load_helper');
const owner_errors = require('../errors/owner_errors');
const boat_errors = require('../errors/boat_errors');

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
 * POST /loads
 *
 * Allows you to create a new load.
 */
router.post('/', checkJwt, (req, res, next) => {

  // Check for missing attributes
  if (errors.checkLoad(req.body)) {

    // Insert Load
    load_helper.insertLoad(req, res);
    
  } else { // Incomplete load
    
    // Set error message
    let message = JSON.stringify({Error :"The request object is missing at least one of the required attributes"});

    // Send Response
    response.sendResponse(res, message, 400);
    
  }
});

  /**
 * GET /loads/:load_id
 * 
 * Allows you to get an existing slip.
 */
router.get('/:load_id', checkJwt, (req, res, next) => {
  
  // Get load to send to client
  load_helper.getLoad(req, res, false, false);
});


  /**
 * GET /loads
 * 
 * List all the loads.
 */
router.get('/', checkJwt, (req, res, next) => {
  
  // Get all loads and send to client
  load_helper.getAllLoads(req, res);

});

/**
 * Patch /loads/:/load_id
 * 
 * Edit a load
 */
router.patch('/:load_id', checkJwt, async (req, res, next) => {

  // Get load
  let load = await load_helper.getLoad(req, res, true, false);

  // Load does not exist
  if (load == false) {
     // Build message and send response
     let message = JSON.stringify({
      Error: "The specified load does not exist"});
    response.sendResponse(res, message, 404);
    return;
  };

  // Set loat
  load = load.load;

  // Check if correct owner
  if (load_helper.checkOwner(req.user.sub, load.owner) == false) {
    let message = JSON.stringify({"Error":"Only owner can update load"});

    response.sendResponse(res, message, 401);
    return;
  };


  for (const key in req.body) {
    load[key] = req.body[key];
  };

  // Assign carrier
  load.carrier = load.carrierid;

  // // Load to be updated
  // let newLoad = {
  //   volume: load.volume, 
  //   item: load.item, 
  //   creation_date: load.creation_date, 
  //   carrier: load.carrierid,
  //   owner: req.user.sub
  // };
  // Updates load to assigned boat
  let t = await load_helper.assignLoadToBoat(load, res, true, parseInt(req.params.load_id), load.carrierid);

  // Send response to user
  response.sendResponse(res, load, 200)
});

  /**
 * DELETE /loads/:load_ids
 * 
 * Deletes load. Updates boat that was carrying it.
 */
router.delete('/:load_id', checkJwt, async (req, res, next) => {

   // Get load
   let load = await load_helper.getLoad(req, res, true, false);

   // If load exist, delete it
   if (load.exist) {

     // Check if correct owner
     if (load_helper.checkOwner(req.user.sub, load.load.owner) == false) {
       let message = JSON.stringify({"Error":"Only owner can delete load"});

       response.sendResponse(res, message, 401);
       return;
     }

     load_helper.deleteLoad(load.load.id, res);
     return;

   } else { // load doesn't exist

    // Set error message
    let message = JSON.stringify({Error :"No load with this load_id exists"});

    // Send Response
    response.sendResponse(res, message, 404);

    return;
  };

}); 

/**
 * Errors on '/*' routes
 */
  router.use((err, req, res, next) => {
  if((err.name === "UnauthorizedError")) {
    owner_errors.postError(res);
    return;
  }
});

module.exports = router;