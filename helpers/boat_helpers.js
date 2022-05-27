const model = require('../models/model-datastore');
const response = require('../utility/response');
const url = require('../utility/url');
// const load_helper = require('../helpers/load_helper');
const {Datastore} = require('@google-cloud/datastore');

// Errors
const boat_errors = require('../errors/boat_errors');

/**
 *  Inserts boat into data store. Sends response
 */

const insertBoat = (req, res) => {

  // Set owner of boat (sub of id token)
  req.body.owner = req.user.sub;

  // Insert boat into datastore
  return model.Insert('boat', req.body)
    .then((boat) => {

      // Set id of boat
      let id = boat[0].mutationResults[0].key.path[0].id;

      // set boat id in response
      req.body['id'] = id;

      // Generate url of request
      req.body['self'] = url.generateUrl(req.protocol, req.get('host'), req.url, 'boats', id);

      // Set owner of boat (sub of id token)
      req.body.owner = req.user.sub;

      // Need to get loads
      req.body['loads'] = [];

      // Send response
      response.sendResponse(res, req.body, 201);
      
      return true;

    })
    .catch((err)=> {return false});
};

/**
 *  Gets boat using id from datastore. Sends response
 */
const getBoat = async (req, res, check) => {

  // Set boat id
  const boat_id = parseInt(req.params.boat_id);
  let checkResponse = {};

  // Get boat
   return model.Retrieve('boat', boat_id)
   .then(async (boat) => {

    // Boat exist
     if (boat[0]) {

      // Private boat and incorrect owner, send error
      ownerRequest = boat[0]['owner'] === req.user.sub
      if(boat[0]['public'] === 'false' && ownerRequest === false){
        boat_errors.privateBoat(res);
        return;
      }

      // list of loads on boat to be returned
      let boatLoads = [];

      // Make a list of loads
      let loadsList = await model.RetrieveList('load', req)
        .then((loads) => {
          return loads[0];
        });


      // Check if load is on boats
      loadsList.forEach(e => {
        if (e.carrier == boat_id) {
          // Set load id
          let i = e[Datastore.KEY].id;
          // Add load to load array
          boatLoads.push({
            id: i,
            item: e.item,
            self: url.generateUrl(req.protocol, req.get('host'), req.url, 'loads', i),
          });
        };
      });
      
       // Set response Message
       let message = {
         id: boat_id,
         name: boat[0].name,
         type: boat[0].type,
         length: boat[0].length,
         owner: req.user.sub,
         self: url.generateUrl(req.protocol, req.get('host'), req.url, 'boats', boat_id),
         loads: boatLoads // replace with get loads
     };

     // if check no response to be sent to client, return true
     if (check) {

        // Set response details
        checkResponse.boat = message;
        checkResponse.exist = true;

        // Send response
        return checkResponse;   
     } else { // Not a check, send response


       // Send response
       response.sendResponse(res, JSON.stringify(message), 200)
     }
       
     } else { //Boat does not exist

    // if check no response to be sent to client, return false
     if (check) {

      return checkResponse.valid = false;

     } else { // not a check send response

          // Error message
          let message = JSON.stringify({
          Error: "No boat with this boat_id exists"
          });

          // Send response
          response.sendResponse(res, message, 404);    
     };
     };
   })
   .catch((err)=> {console.log(err)});
};

/**
 *  Gets all boats from datastore.
 */
const getAllBoats = async (req, res) => {

    // Get all boats
    await model.RetrieveList('boat', req.user.sub)
    .then((boat) => {

      // Loop through response, add id from datastore to response
      for (let index = 0; index < result[0].length; index++) {
        const objsymbol = Object.getOwnPropertySymbols(result[0][index])
        let boat_id =parseInt(result[0][index][objsymbol[0]].id)
        result[0][index]['id'] = boat_id;
      }

      // Add boats to return message
      formattedBoats = {
        boats: boat[0]
      }
      
      // Add next page to return message
      if(boat[1].moreResults !== Datastore.NO_MORE_RESULTS ){
       // Encode cursor
        let s = encodeURIComponent(boat[1].endCursor);

        // Set start postion
        formattedBoats.next = url.generateUrl(req.protocol, req.get('host'), req.baseUrl, 'boats?cursor=', s);
      };

      // Boat exist
      if (boat[0]) {
        
      // send to Client
      response.sendResponse(res, formattedBoats, 200);
      };
    });
};

/**
 * 
 * Deletes boat from datastore
 * @param {integer} boat_id 
 * @param {response} res 
 */
const deleteBoat = (boat_id, res) => {
  
  // Delete boat
  model.Remove("boat", boat_id)
    .then((sunkenShip) => {

        // Error message
        let message = JSON.stringify({});

        // Send response
        response.sendResponse(res, message, 204);    
    })

}

module.exports = {
  insertBoat,
  getBoat,
  getAllBoats,
  deleteBoat
}