const model = require('../models/model-datastore');
const response = require('../utility/response');
const url = require('../utility/url');
const {Datastore} = require('@google-cloud/datastore');
const boat_helper = require('../helpers/boat_helpers');

/**
 *  Insert owner into datastore.
 */
 const insertOwner = (req, res) => {
    // Set boats to none
    req.body.boats = [];
    // Insert Owner
    model.Insert('owners', req.body)
      .then((owner) => {
        // Set id of added load
        let id = owner[0].mutationResults[0].key.path[0].id;
        
        // Set id in req.body
        req.body['id'] = id;

        // Set url of request
        req.body['self'] = url.generateUrl(req.protocol, req.get('host'), req.url, 'owners', id)

        response.sendResponse(res, req.body, 201);
      });
  };

  /**
   * Returns a list of all boats for owner and sends response to client
   * @param {request} req 
   * @param {response} res 
   */
  const getOwnerBoats = (req, res) => {
    model.RetrieveBoatsByOwner('boat', req.user.sub, false)
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
      else { // No boats, send empty list
        response.sendResponse(res, [], 200);
      }
  }).catch((err) => {console.log(err);});
  }

  /**
   * Gets a list of all public boats for owner and returns response to client
   * @param {request} req 
   * @param {response} res 
   */
  const getAllOwnerPublicBoats = (res, owner) => {

    model.RetrieveOwners('boat', owner[0].sub, true)
      .then((result) => {
        // if boats, send response
        if (result[0]){
            response.sendResponse(res, result[0], 200);
        } else { // no boats for user, send empty list
            response.sendResponse(res, [], 200);
        }
     })
     .catch((err) => {console.log(err);})
  };

  /**
   * Loop through list of owners, adding id to list
   * @param {List of owners} owners 
   */
  const addIdToOwners = (owners) => {

      // Loop through response, add id from datastore to response
      for (let index = 0; index < owners.length; index++) {
        const objsymbol = Object.getOwnPropertySymbols(owners[index])
        let owner_id =parseInt(owners[index][objsymbol[0]].id)
        owners[index]['id'] = owner_id;
        // Remove boats attribute
        delete owners[index]['boats'];
        // Rename sub attribute
        owners[index]['owner'] = owners[index]['sub']
        delete owners[index]['sub'];
        };
        
    return owners;
  };

  module.exports = {
    insertOwner,
    getOwnerBoats,
    getAllOwnerPublicBoats,
    addIdToOwners
  }