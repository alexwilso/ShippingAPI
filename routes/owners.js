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
const owner_errors = require('../errors/owner_errors');
// Client Response
const response = require('../utility/response');
// Helpers
const owner_helpers = require('../helpers/owner_helpers');
const boat_helper = require('../helpers/boat_helpers');
const load_helper = require('../helpers/load_helper');
const utility_errors = require('../errors/utility_errors');
// datastore model
const model = require('../models/model-datastore');
const {Datastore} = require('@google-cloud/datastore');
const url = require('../utility/url');


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
* Post /owners
* 
* Create a new owner
*/
router.post('/', checkJwt, async (req, res, err) => {

  // Check accepts
  if (utility_errors.jsonAccepts(req) == false) {
    response.sendResponse(res, {"Error": 'Not Acceptable'}, 406);
    return;
  };

  // Add email and sub to body
  req.body.email = req.user.name;
  req.body.sub = req.user.sub;

  // Make a list of owners
  let ownersList = await model.RetrieveList('owners', req)
    .then((owners) => {
      return owners[0];
    });

  // Check if owner already exist
  if(owner_errors.checkExist(res, ownersList, req.body.sub)){
    return;
  };

  // Add Owner
  owner_helpers.insertOwner(req, res);
   
});


/**
 * Get /owners/owner_id
 * 
 * Get an owner
 */
router.get('/:owner_id', checkJwt, (req, res, next) => {

  // Check accepts
  if (utility_errors.jsonAccepts(req) == false) {
    response.sendResponse(res, {"Error": 'Not Acceptable'}, 406);
    return;
  };

  // Get owner
  model.Retrieve('owners', parseInt(req.params.owner_id))
    .then(ow => {

      // Owner does not exist
      if (owner_errors.ownerDoesNotExist(res, ow[0]) == true) {
        return;
      };

      // Check if owner is making request
      if(owner_errors.invalidPermission(req, res, ow[0]) == true){
        return
      };

      // Set id Field
      const objsymbol = Object.getOwnPropertySymbols(ow[0])
      let boat_id =parseInt(ow[0][objsymbol[0]].id)
      ow[0]['id'] = boat_id;

      // Add self property
      ow[0]['self'] = url.generateUrl(req.protocol, req.get('host'), req.url, 'owners', ow[0]['id']);

      // Send response to client
      response.sendResponse(res, ow[0], 200);
    });
});

/**
* Get /ownersx
* Gets a list of all owners
*/
router.get('/', async (req, res, next) => {

  // Check accepts
  if (utility_errors.jsonAccepts(req) == false) {
    response.sendResponse(res, {"Error": 'Not Acceptable'}, 406);
    return;
  };

  // Returns a list of all owners
  model.RetrieveList('owners', req)
    .then((result) => {
      // if owners, send response
      if (result[0]){

        // Remove loads from owners
        result[0].forEach(el => {
          delete el['loads']
          });
              
        // Adds ids to owners
        let idOwners = owner_helpers.addIdToOwners(result[0]);
  
        // Send response
        response.sendResponse(res, idOwners, 200);
  
        } else { // no owners, send empty list
          response.sendResponse(res, [], 200);
        };
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

  // Check accepts
  if (utility_errors.jsonAccepts(req) == false) {
    response.sendResponse(res, {"Error": 'Not Acceptable'}, 406);
    return;
  };

  // Set owner 
  let owner = await model.Retrieve('owners', parseInt(req.params.owner_id), req);
    
  // Owner does not exist
  if (owner_errors.ownerDoesNotExist(res, owner) == true) {
    return;
  };

  // If owner is accessing their boats, display all
  if (owner[0].sub == req.user.sub) {

    // Get owner boats and send response to user
      owner_helpers.getOwnerBoats(req, res);
      return;
      } 
  else { 
      // gets a list of all public boats for owner
      owner_helpers.getAllOwnerPublicBoats(res, owner);
      return;
    };
});

/**
* GET /owner/:owner_id/loads
* 
* List all the loads for owner
* Add self
*/
router.get('/:owner_id/loads', checkJwt, async (req, res, next) => {

  // Check accepts
  if (utility_errors.jsonAccepts(req) == false) {
    response.sendResponse(res, {"Error": 'Not Acceptable'}, 406);
    return;
  };

  // get owner
  let owner = await owner_helpers.getOwnerById(req, res);

  // Owner does not exist
  if (owner_errors.ownerDoesNotExist(res, owner) == true) {
    return;
  };

  // Make a list of loads
  let loadsList = await model.RetrieveList('load', req)
  .then((loads) => {
    return loads[0];
  });

  let ownerLoads = [];

  loadsList.forEach(el => {
    // Add all ownerLoads to return list
    if (owner.sub == el.owner) {
      ownerLoads.push(el);
    };
  });

  response.sendResponse(res, ownerLoads, 200);
});
/**
 * DELETE /:owner_id
 * 
 * Deletes owner. Deletes all boats and removes loads. Deletes loads.
 */
router.delete('/:owner_id', checkJwt, async(req, res, next) => {

  // get owner
  let owner = await owner_helpers.getOwnerById(req, res);
  
  // Owner does not exist
  if (owner_errors.ownerDoesNotExist(res, owner) == true) {
    return;
  };

  // Check if owner is making request
  if(owner_errors.invalidPermission(req, res, owner) == true){
    return
  };

  // Make a list of loads
  let loadsList = await model.RetrieveList('load', req)
  .then((loads) => {
    return loads[0];
  });

  // Loop through owners boats and delete them
  owner['boats'].forEach(element => {

    // Loop through list of loads
    loadsList.forEach(async (el) => {
      const loadId = parseInt(el[Datastore.KEY].id);

      // Delete loads that belong to owner
      if (owner.sub == el.owner) {
        el.carrier = null; // change carrier, so update doen't fire
        load_helper.deleteLoad(loadId, res, true);
      };

      // Unload loads on owners boats
      if (element.id == el.carrier) {
      
      // assigns load to a boat
      load_helper.assignLoadToBoat(el, res, true, loadId, null);
      };
    });
    // Delete boat
    boat_helper.deleteBoat(element.id, res, true);
  });

  // Delete owner and send response to client
  owner_helpers.deleteOwner(req, res);
  res.status(204).send(JSON.stringify({}));
  return;
});

/**
 * Errors on "/*" routes.
 */
router.use((err, req, res, next) => {

  // Delete//Post invalid token
  if (err.name === "UnauthorizedError") {

    if (req.method == "POST" || req.method == "GET") {
      owner_errors.postError(res);
      return;
    } 
    else {
      // Get a list of all owners and their boats
      let owner = req.path.slice(1, -6);
      model.RetrieveOwners('boat', owner, true)
      .then((result) => {
        // if boats, send response
        if (result[0]){

          // Add id to response
          let boats = boat_helper.addIdToBoats = result[0];

          // send response
            response.sendResponse(res, boats, 200);
      } else { // no boats for user, send empty list
          response.sendResponse(res, [], 200);
        }
      });
    }
  }
});
  module.exports = router;