'use strict';

const express = require('express');
const bodyParser = require('body-parser');
require('dotenv').config();
const jwt = require('express-jwt');
const jwksRsa = require('jwks-rsa');
require('dotenv').config();

const router = express.Router();

const model = require('../models/model-datastore');
// Error handeling
const errors = require('../utility/errors');
const ownerErrors = require('../errors/owner_errors');

const response = require('../utility/response');

// helpers
const boat_helper = require('../helpers/boat_helpers');
const load_helper = require('../helpers/load_helper');


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
 * POST /boats
 *
 * Allows you to create a new boat
*/
router.post('/', checkJwt, (req, res, next) => {
  
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
    }
} catch(error) {
  console.log(error);

  // Json Message
  let errorMessage = {
      "Error": "invalid permission..."
  };

  // Send response to client
  response.sendResponse(res, errorMessage, 401);
}
});


 /**
 * GET /boats/:boat_id
 *
 * Allows you to get an existing boat
 */
router.get('/:boat_id', (req, res, next) => {

  // Get boat to send to client
  boat_helper.getBoat(req, res, false);

});


 /**
 * GET /boats
 *
 * List all the boats
 */
  router.get('/', checkJwt, (req, res, next) => {

    try {
        model.RetrieveList('boat', req.user.sub)
        .then((result) => {
            // if boats, send response
            if (result[0]){

                // Loop through response, add id from datastore to response
                for (let index = 0; index < result[0].length; index++) {
                    const objsymbol = Object.getOwnPropertySymbols(result[0][index])
                    let boat_id =parseInt(result[0][index][objsymbol[0]].id)
                    result[0][index]['id'] = boat_id;
                }

                // Send response
                response.sendResponse(res, result[0], 200);
            } else { // no boats for user, send empty list
                response.sendResponse(res, [], 200);
            }
        })
        .catch(err => console.log(err));
    } catch (error) {
        next(error)
    }
});

 /**
 * DELETE /boats/:boat_id
 *
 * Deleting a boat will unload any loads that were loaded on to it.
 */

router.delete('/:boat_id', async (req, res, next) => {

  // Get boat
  let boat = await boat_helper.getBoat(req, res, true);

  let waiting = true;

  // Boat does not exist
  if (!boat.exist) {

      // Build message
      let message = JSON.stringify({
        Error: "No boat with this boat_id exists"
      });

      // Send response
      response.sendResponse(res, message, 404);

      return


  };

  // Loads that need to be unloaded
  let loads = boat.boat.loads;

  // loops through loads, unloads them
  for(let x = 0; x < loads.length; x++){
    // Set load id in request params
    req.params.load_id = loads[x].id;

    // Gets load
    let load = await load_helper.getLoad(req, res, true);

    // Load to be updated
    let newLoad = {
      volume: load.load.volume, 
      item: load.load.item, 
      creation_date: load.load.creation_date, 
      carrier: null
    };

    // Updates load to assigned boat
    let t = await load_helper.assignLoadToBoat(newLoad, res, true, load.load.id);

    // Resolve promise
    if (x === loads.length){
      // let t = await boat_helper.deleteBoat(boat.boat.id, res);
    };
  };

  // Delete boat and send respnse to client
  boat_helper.deleteBoat(boat.boat.id, res);
  return;

});


  /**
 * PUT boats/:boat_id/loads/:load_id
 * 
 * Assigns load to a boat. Load must not be already assigned.
 */
   router.put('/:boat_id/loads/:load_id', async (req, res, next) => {

    // Get boat
    let boat = await boat_helper.getBoat(req, res, true);
     
    // Get load
    let load = await load_helper.getLoad(req, res, true);


    // Assigned load
    let unassigned = true;
    
    let exist = true;

    // If boat and load don't exist
    if (!boat.exist || !load.exist) {
      
      // Build message
      let message = JSON.stringify({
        Error: "The specified boat and/or load does not exist"
      });

      // exist is set to false
      exist = false;

      // Send response
      response.sendResponse(res, message, 404);

    };

    // If load exist
    if (load.exist && exist) {
      
      // And load is unassigned
      if (load.load.carrier != null) {

              // Build message
        let message = JSON.stringify({
          Error: "The load is already loaded on another boat"
        });

        // Assigend is true
        unassigned = false;

        // Send response
        response.sendResponse(res, message, 403);
      };
    };

    // Assign load to boat
    if (exist && unassigned) {

      // Load to be updated
      let updatedLoad = {
        volume: load.load.volume,
        item: load.load.item,
        creation_date: load.load.creation_date,
        carrier: boat.boat.id
      }
      
      // Assign
      load_helper.assignLoadToBoat(updatedLoad, res, false, load.load.id);
      
    };
   });

/**
 * Delete boats/:boat_id/loads/:load_id
 * 
 * Deletes load from boat. 
 */
router.delete('/:boat_id/loads/:load_id', async (req, res, next) => {

    let exist = true;

    // Get boat
    let boat = await boat_helper.getBoat(req, res, true);

    // Get load
    let load = await load_helper.getLoad(req, res, true);

    // If load exist
    if (load.exist) {
    
      // And load not assigned to carrier
      if (load.load.carrier == null) {
          // Build message
          let message = JSON.stringify({
            Error: "No boat with this boat_id is loaded with the load with this load_id"
          });

          // Send response
          response.sendResponse(res, message, 404);

          return;
        
      };
  };


    // If boat and load don't exist
    if (!boat.exist || !load.exist) {
        
      // Build message
      let message = JSON.stringify({
        Error: "No boat with this boat_id is loaded with the load with this load_id"
      });

      // exist is set to false
      exist = false;

      // Send response
      response.sendResponse(res, message, 404);

      return;

    };
    
    // Both boat and load exist
    // if (exist) {
    // Load is on boat
      if (load.load.carrier.id === req.params.boat_id) {
         // Load to be updated
         let updatedLoad = {
          volume: load.load.volume,
          item: load.load.item,
          creation_date: load.load.creation_date,
          carrier: null
        }
        
        // Update boat
        load_helper.assignLoadToBoat(updatedLoad, res, false, load.load.id);
        
      } else{ // Load is not on boat

         // Build message
        let message = JSON.stringify({
          Error: "No boat with this boat_id is loaded with the load with this load_id"
        });

        // Send response
        response.sendResponse(res, message, 404);

        return;
      }; 
  
});


  /**
 * Get /boats/:boat_id/loads
 * 
 * Gets all loads for a given boat
 */
router.get('/:boat_id/loads', async (req, res, next) => {

  // Check if boat exist
  let boat = await boat_helper.getBoat(req, res, true);
  
  if (boat.exist) {

    let loads = boat.boat.loads;

    let returnLoads = [];

    for (let index = 0; index < loads.length; index++) {
      const element = loads[index];

      // Sets req.params
      req.params.load_id = element.id;

      // Gets load
      let currentLoad = await load_helper.getLoad(req, res, true);

      // Load object to be added to list
      let currentLoadObj = {
        id: currentLoad.load.id, 
        item: currentLoad.load.item, 
        creation_date: 
        currentLoad.load.creation_date, 
        self: currentLoad.load.self
      };

      // Adds load to return list
      returnLoads.push(currentLoadObj);
      
    };

    // Error message
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

  // Delete//Post invalid token
  if (err.name === "UnauthorizedError" && (req.method === 'POST' || req.method === "DELETE")) {
    // Send error to client
    ownerErrors.postError(res);
    return;
  }

  // Get invalid Token
  if (err.name === "UnauthorizedError" && req.method === 'GET') {

      // Display all boats with public
      try {
          model.RetrieveList('boat', null)
          .then((result) => {
              // if boats, send response
              if (result[0]){

                  // Loop through response, add id from datastore to response
                  for (let index = 0; index < result[0].length; index++) {
                      const objsymbol = Object.getOwnPropertySymbols(result[0][index])
                      let boat_id =parseInt(result[0][index][objsymbol[0]].id)
                      result[0][index]['id'] = boat_id;
                  }

                  // Send response
                  response.sendResponse(res, result[0], 200);
                  return;
              } else { // no boats for user, send empty list

                  // Send response
                  response.sendResponse(res, [], 200);
                  return;
              }
          })
            .catch(err => console.log(err));
      } catch (error) {
          next(error)
      }
  }
  else {
      next(err);
  }
});

module.exports = router;