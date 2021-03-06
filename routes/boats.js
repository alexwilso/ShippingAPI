'use strict';
require('dotenv').config();
// Set up router
const express = require('express');
const router = express.Router();
const bodyParser = require('body-parser');
router.use(bodyParser.json({}));

// Token validation 
const jwt = require('express-jwt');
const jwksRsa = require('jwks-rsa');

// Error handeling
const errors = require('../errors/utility_errors');
const owner_errors = require('../errors/owner_errors');
const boat_errors = require('../errors/boat_errors');
const utility_errors = require('../errors/utility_errors');

// Client response
const response = require('../utility/response');

// helpers
const boat_helper = require('../helpers/boat_helpers');
const load_helper = require('../helpers/load_helper');
const url = require('../utility/url');

// datastore model
const model = require('../models/model-datastore');

// Checks for valid jwt
const checkJwt = jwt({
  secret: jwksRsa.expressJwtSecret({
    cache: true,
    rateLimit: true,
    jwksRequestsPerMinute: 5,
    jwksUri: `https://wilsoal9-493.us.auth0.com/.well-known/jwks.json`
  }),
  // Validate the audience and the issuer.
  issuer: `https://wilsoal9-493.us.auth0.com/`,
  algorithms: ['RS256']
});

/**
 * POST /boats
 *
 * Allows you to create a new boat
 * 
*/
router.post('/', checkJwt, (req, res, next) => {

  // Check accepts
  if (utility_errors.jsonAccepts(req) == false) {
    response.sendResponse(res, {"Error": 'Not Acceptable'}, 406);
    return;
  }

  // Unacceptable content
  if (req.headers['content-type'] == 'text/html') {
       response.sendResponse(res, {"Error": 'Not Acceptable'}, 406);
       return;
  };
  
  try {
    // Check requst body for errors
    if (errors.checkBoat(req.body)) {

      // Insert Boat
      boat_helper.insertBoat(req, res);

    } else { // Incomplete boat recieved, invalid response sent

        // Set error message
        let message = JSON.stringify({Error :"The request object is missing at least one of the required attributes"});

        // Send response
        response.sendResponse(res, message, 400);
    };
} catch(error) {
  console.log(error);
  };
});

 /**
 * GET /boats/:boat_id
 *
 * Allows you to get an existing boat
 */
router.get('/:boat_id', checkJwt, (req, res, next) => {

  // Check accepts
  if (utility_errors.jsonAccepts(req) == false) {
    response.sendResponse(res, {"Error": 'Not Acceptable'}, 406);
    return;
  }

  // Get boat to send to client
  boat_helper.getBoat(req, res, false);

});

 /**
 * GET /boats
 *
 * List all the boats
 */
  router.get('/', checkJwt, async (req, res, next) => {

    // Check accepts
    if (utility_errors.jsonAccepts(req) == false) {
      response.sendResponse(res, {"Error": 'Not Acceptable'}, 406);
      return;
    };

    try {
        model.RetrieveList('boat', null, req.user.sub)
        .then(async (result) => {
            // if boats, send response
            if (result[0]){

              // Add id to boats
              let boatsId = boat_helper.addIdToBoats(result[0]);

              // Make a list of loads
              let loadsList = await model.RetrieveList('load', req)
              .then((loads) => {
              return loads[0];
              });
              
              // Add id to loads
              loadsList = boat_helper.addIdToBoats(loadsList);

              // remove private boats from return
              result[0].forEach((el, i) => {

                // generate url
                el.self = url.generateUrl(req.protocol, req.get('host'), req.url, 'boats', el.id);

                // if boat is private remove it
                if (el.owner != req.user.sub) {
                  if (el.public == "false") {
                    result[0].splice(i, 1);
                  }; 
                }
                
                // Adds loads to boat
                el.loads = boat_helper.addLoadToBoat(loadsList, el.id, req)
              });
              // Send response
              response.sendResponse(res, boatsId, 200);
            } else { // no boats for user, send empty list
                response.sendResponse(res, [], 200);
            }
        })
    } catch (error) {
        next(error)
    }
});

 /**
 * DELETE /boats/:boat_id
 *
 * Deleting a boat will unload any loads that were loaded on to it.
 */

router.delete('/:boat_id', checkJwt, async (req, res, next) => {
  // Store boat_id, it changes with request
  let boat_id_request = req.params.boat_id; 
  // Get boat
  let boat = await boat_helper.getBoat(req, res, true);

  // Revert boat_id to original
  req.params.boat_id = boat_id_request;

  // Boat does not exist
  if (!boat.exist) {
    // Send Error message
    boat_errors.nonexistingBoatError(res);
    return;
  };
  
  // Check incorrect owner, sends error to client if incorrect
  if (boat_errors.wrongOwner(req.user.sub, boat.boat.owner, res)) {
    return;
  };

  // unloads loads from boat
  load_helper.unloadLoads(req, res, boat.boat.loads);

  // Delete boat and send respnse to client
  boat_helper.deleteBoat(boat.boat.id, res, false);
  return;
});

/**
 * Patch boats/:boat_id
 * Updating boat using patch
 */
router.patch('/:boat_id', checkJwt, (req, res, next) => {

  // Check accepts
  if (utility_errors.jsonAccepts(req) == false) {
    response.sendResponse(res, {"Error": 'Not Acceptable'}, 406);
    return;
  };

  // method not supported
  response.sendResponse(res, {}, 405)
  return;                                                                                                                                  
});

  /**
 * PUT boats/:boat_id/loads/:load_id
 * 
 * Assigns load to a boat. Load must not be already assigned.
 */
  router.put('/:boat_id/loads/:load_id', checkJwt, async (req, res, next) => {

     // Check accepts
    if (utility_errors.jsonAccepts(req) == false) {
      response.sendResponse(res, {"Error": 'Not Acceptable'}, 406);
      return;
    };

    // Store boat_id, it changes with request
    let boat_id_request = req.params.boat_id; 
    // Get boat/load
    let boat = await boat_helper.getBoat(req, res, true);
    let load = await load_helper.getLoad(req, res, true, false);
    // Revert boat_id to original
    req.params.boat_id = boat_id_request;

    // Private boat
    if (boat_errors.privateBoatEror(res, boat)){
      return;
    }

  // If boat and load don't exist      
  if (boat_errors.noLoadBoatExist(res, boat, load) == true) {
    return;
  };

    // Check if correct owner
    if (load_helper.checkOwner(req.user.sub, load.load.owner) == false) {

      // Build message and send resposne
      let message = JSON.stringify({"Error":"Only load owner can add load to boat"});
      response.sendResponse(res, message, 401);
      return;
    };
  
    // And load is unassigned
    if (load.load.carrier != null) {

      // Build message and send response
      let message = JSON.stringify({
        Error: "The load is already loaded on another boat"});
        response.sendResponse(res, message, 403);
        return;
      };
      
    // Assign load to boat
    load_helper.assignLoadToBoat(load.load, res, false, load.load.id, boat.boat.id);
    return;   
  });

/**
 * Delete boats/:boat_id/loads/:load_id
 * 
 * Deletes load from boat. 
 */
router.delete('/:boat_id/loads/:load_id', checkJwt, async (req, res, next) => {
  // Store boat_id, it changes with request
  let boat_id_request = req.params.boat_id;

  // Get boat/load
  let boat = await boat_helper.getBoat(req, res, true);
  let load = await load_helper.getLoad(req, res, true, false);
  // Revert boat_id to original
  req.params.boat_id = boat_id_request;

  // Load or boat does not exist
  if (boat_errors.noLoadBoatExist(res, boat, load) == true) {
    return;
  };

  // Check owner
  // Check if correct owner
  if (load_helper.checkOwner(req.user.sub, load.load.owner) == false || boat.owner == req.user.sub) {

    // Build message and send resposne
    let message = JSON.stringify({"Error":"Only load or boat owner can remove load from boat"});
    response.sendResponse(res, message, 403);
    return;
  }; 
  
  // load not assigned to carrier
  if (load.load.carrier == null || load.load.carrier.id != req.params.boat_id) {

    // Build message and send response
    let message = JSON.stringify({
      Error: "No boat with this boat_id is loaded with the load with this load_id"});
      response.sendResponse(res, message, 404);
      return;
  };

     // Unload load from boat
      if (load.load.carrier.id == req.params.boat_id) {
        // Update boat
        load_helper.assignLoadToBoat(load.load, res, false, load.load.id, null);
      };
});

  /**
 * Get /boats/:boat_id/loads
 * 
 * Gets all loads for a given boat
 */
router.get('/:boat_id/loads', checkJwt, async (req, res, next) => {

  // Check accepts
  if (utility_errors.jsonAccepts(req) == false) {
    response.sendResponse(res, {"Error": 'Not Acceptable'}, 406);
    return;
  };

  // Store boat_id, it changes with request
  let boat_id_request = req.params.boat_id;
  // Check if boat exist
  let boat = await boat_helper.getBoat(req, res, true);
  // Revert boat_id to original
  req.params.boat_id = boat_id_request;
  
  if (boat.exist) {

    // all loads
    let loads = boat.boat.loads;

    // Gets a loads for boats
    let returnLoads = await load_helper.loadsForBoatWithId(loads, req, res);

    // List of loads
    let message = JSON.stringify({loads: returnLoads});

    // Send response
    response.sendResponse(res, message, 200);
    
    return;
 
  } else { // boat does not exist

    // Error message
    let message = JSON.stringify({Error: "No boat with this boat_id exists"});

    // Send response
    response.sendResponse(res, message, 404);   

    return;
  };
});

/**
* Errors on "/*" routes.
*/
 router.use((err, req, res, next) => {

  // Sends a list of all public boats for unauthorized GET requset
  if (err.name === "UnauthorizedError" && req.method === 'GET') {

      // Display all boats with public
      try {
          model.RetrieveList('boat', null)
          .then(async (result) => {
              // if boats, send response
              if (result[0]){

                // Make a list of loads
                let loadsList = await model.RetrieveList('load', req)
                .then((loads) => {
                return loads[0];
                });

                // Add id to boats
                let boatsId = boat_helper.addIdToBoats(result[0]);

                  // Loop through response, add id from datastore to response
                  for (let index = 0; index < boatsId.length; index++) {

                    // If boat is not public, remove it
                    if (boatsId[index].public == 'false') {
                      boatsId.splice(index, 1); // Remove if not public
                      index--; // removing from list, move back index
                    } else {
                        
                    // Adds loads to boat
                    boatsId[index]['loads'] = boat_helper.addLoadToBoat(loadsList, boatsId[index].id, req);
                    // Adds url to boat
                    boatsId[index]['self'] = url.generateUrl(req.protocol, req.get('host'), req.url, 'boats', boatsId[index]['id'])
                    };
                  };

                  // Send response
                  response.sendResponse(res, boatsId, 200);
                  return;

              } else { // no boats for user, send empty list

                // Send response
                response.sendResponse(res, [], 200);
                return;

              }
          });
      } catch (error) {
          next(error)
      }
  }
  // Sends an error message
  else {
    owner_errors.postError(res);
    return;
  }
});

module.exports = router;