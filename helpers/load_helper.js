const url = require('../utility/url');

// Response to client
const response = require('../utility/response');

// Datastore
const {Datastore} = require('@google-cloud/datastore');
const model = require('../models/model-datastore');

// Helpers
const boat_helper = require('../helpers/boat_helpers');

/**
 * Loops through list of loads, updating carrier to Null
 * @param {list of Loads} loads 
 */

const unloadLoads = async (req, res, loads) => {

  // loops through loads, unloads them
  for(let x = 0; x < loads.length; x++){
    // Set load id in request params
    req.params.load_id = loads[x].id;

    // Gets load
    let load = await getLoad(req, res, true, true);

    // Load to be updated
    let newLoad = {
      volume: load.volume, 
      item: load.item, 
      creation_date: load.creation_date, 
      carrier: null,
      owner: req.user.sub
    };
    // Updates load to assigned boat
    let t = await assignLoadToBoat(newLoad, res, true, parseInt(req.params.load_id));
  };
  return;
}

/**
 *  Insert Load into datastore.
 */
const insertLoad = (req, res) => {

    // Set carrier to unassigned
    req.body.carrier = null;

    // Set owner to owner
    req.body.owner = req.user.sub

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
 const getLoad = (req, res, check, unloading) => {

  // Set load id
  const load_id = parseInt(req.params.load_id);
  let checkResponse = {};
  let carrier = null;

  // Get Load
  return model.Retrieve('load', load_id)
    .then(async (load) => {
      
      // Load exist
      if (load[0]) {
        
        // If removing load from boat
        if (unloading) {
          return load[0];
        }
        // If load on carrier, set carrier information
        if (load[0].carrier != null) {
          
          // Set boat id
          req.params.boat_id = load[0].carrier

          // Get boat data
          var boat = await boat_helper.getBoat(req, res, true);
          
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
          owner: load[0].owner, 
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
      console.log(load);
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
  })
  .catch(err => {console.log(err)});
};

/**
 *  Delete a load
 */
const deleteLoad = (load_id, res, check) => {
    // Delete boat
    model.Remove("load", load_id)
    .then((sunkenShip) => {

      // Check do not send message
      if(check == true){
        return;
      }

        // No content in response body
        let message = JSON.stringify({});

        // Send response
        response.sendResponse(res, message, 204);    
    })
    .catch(err =>{console.log(err);});
};

/**
 * Check load owner
 * @param {client making request} requester 
 * @param {load owner} owner 
 * @returns 
 */
const checkOwner = (requester, owner) => {
  if (requester !== owner) {
    return false;
  }
};

/**
 * // Gets load details for all loads on boat with matching id
 * @param {list of loads} loads 
 * @param {request} req 
 * @param {response} res 
 */
const loadsForBoatWithId = async (loads, req, res) => {
  let returnLoads = [];

  for (let index = 0; index < loads.length; index++) {
    const element = loads[index];

    // Sets req.params
    req.params.load_id = element.id;

    // Gets load
    let currentLoad = await getLoad(req, res, true, false);

    // Load object to be added to list
    let currentLoadObj = {
      id: currentLoad.load.id, 
      item: currentLoad.load.item,
      creation_date: currentLoad.load.creation_date, 
      self: currentLoad.load.self
    };

    // Adds load to return list
    returnLoads.push(currentLoadObj);
  };
  return returnLoads;
};


module.exports = {
  insertLoad,
  getLoad,
  getAllLoads,
  assignLoadToBoat,
  deleteLoad,
  checkOwner,
  unloadLoads,
  loadsForBoatWithId
}