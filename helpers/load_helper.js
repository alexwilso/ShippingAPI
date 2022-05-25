const model = require('../models/model-datastore');
const response = require('../utility/response');
const url = require('../utility/url');
const {Datastore} = require('@google-cloud/datastore');
const boat_helper = require('../helpers/boat_helpers');


/**
 *  Insert Load into datastore.
 */
const insertLoad = (req, res) => {

    // Set carrier to unassigned
    req.body.carrier = null;

    // Insert load
    model.Insert('load', req.body)
      .then((load) => {
        // Set id of added load
        let id = load[0].mutationResults[0].key.path[0].id;
        
        // Set id in req.body
        req.body['id'] = id;

        // Set url of request
        req.body['self'] = url.generateUrl(req.protocol, req.get('host'), req.url, 'loads', id)

        // Send response to client
        response.sendResponse(res, req.body, 201);
      });
};

/**
 *  Gets load using id from datastore. Sends response
 */
 const getLoad = (req, res, check) => {

  // Set load id
  const load_id = parseInt(req.params.load_id);
  let checkResponse = {};
  let carrier = null;

  // Get Load
  return model.Retrieve('load', load_id)
    .then(async (load) => {
      
      // Load exist
      if (load[0]) {
        
        // If load on carrier, set carrier information
        if (load[0].carrier != null) {
          
          // Set boat id
          req.params.boat_id = load[0].carrier


          // Get boat data
          let boat = await boat_helper.getBoat(req, res, true);
          
          // Set carrier data
          carrier = {
            id: boat.boat.id,
            name: boat.boat.name,
            self: boat.boat.self
          };
          
        };


        // set response message
        let message = {
          id: load_id,
          volume: load[0].volume,
          carrier: carrier,
          item: load[0].item,
          creation_date: load[0].creation_date,
          self: url.generateUrl(req.protocol, req.get('host'), req.url, 'loads', load_id),
        };

        // if check, no response to be sent to client, return true
        if (check) {

          // set load and exist keys
          checkResponse.load = message;
          checkResponse.exist = true;

          // Send response to caller
          return checkResponse;
          
        } else { //not a check, send response

          // Send response to client
          response.sendResponse(res, JSON.stringify(message), 200)

        }

      } else { // load does not exist
        
       // if check no response to be sent to client, return false
     if (check) {

      return checkResponse.valid = false;

     } else { // not a check send response

          // Error message
          let message = JSON.stringify({
          Error: "No load with this load_id exists"
          });

          // Send response
          response.sendResponse(res, message, 404);    
     };
     };
    })
    .catch((err) => {
      console.log(err);
      return false;
    })
};

/**
 *  Gets all loads in datastore.
 */
const getAllLoads = (req, res) => {
  
  // Get all loads
  model.Retrieve('load', null, req)
    .then((load) =>{
      
      // Add boat to return message
      formattedLoads = {
        loads: load[0]
      };
      

      // Add next page to return message
      if(load[1].moreResults !== Datastore.NO_MORE_RESULTS ){

        // encode return string
        let s = encodeURIComponent(load[1].endCursor);

        formattedLoads.next = url.generateUrl(req.protocol, req.get('host'), req.baseUrl, 'loads?cursor=', s);
      };
      // Load exist
      if (load[0]) {

        // Send to client
        response.sendResponse(res, formattedLoads, 200);
      };
    });
};

/**
 *  Assigns load to boat
 */
const assignLoadToBoat = (load, res, check, load_id) => {

  // Update load
  model.Update('load', load, load_id)
    .then((loaded) =>{

       // if check no response to be sent to client, return false
       if (check) {
         return false;
        
      } else { // Response sent to client
        
        // message to send to client
        let message = 'Load successfully added to boat';

        // Send resoponse to client
        response.sendResponse(res, message, 204);


      }
    });
};

/**
 *  Delete a load
 */
const deleteLoad = (load_id, res) => {
    // Delete boat
    model.Remove("load", load_id)
    .then((sunkenShip) => {

        // No content in response body
        let message = JSON.stringify({});

        // Send response
        response.sendResponse(res, message, 204);    
    })

};


module.exports = {
  insertLoad,
  getLoad,
  getAllLoads,
  assignLoadToBoat,
  deleteLoad
}