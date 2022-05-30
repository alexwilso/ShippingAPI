const model = require('../models/model-datastore');
const response = require('../utility/response');
const url = require('../utility/url');
const {Datastore} = require('@google-cloud/datastore');
const boat_helper = require('../helpers/boat_helpers');

/**
 *  Insert owner into datastore.
 */
 const insertOwner = (req, res) => {
    // Set boats/loads to empty
    req.body.boats = []; 
    req.body.loads = [];
    
    // Insert Owner
    model.Insert('owners', req.body)
      .then((owner) => {
        // Set id of added load
        let id = owner[0].mutationResults[0].key.path[0].id;
        
        // Set id in req.body
        req.body['id'] = id;

        // Set url of request
        req.body['self'] = url.generateUrl(req.protocol, req.get('host'), req.url, 'owners', id);

        response.sendResponse(res, req.body, 201);
      });
  };

  /**
   * Returns a list of all boats for owner and sends response to client
   * @param {request} req 
   * @param {response} res 
   */
  const getOwnerBoats = (req, res, check) => {
    return model.RetrieveBoatsByOwner('boat', req.user.sub, false)
    .then((result) => {
      // if boats, send response
      if (result[0]){

        // Loop through response, add id from datastore to response
        for (let index = 0; index < result[0].length; index++) {
          const objsymbol = Object.getOwnPropertySymbols(result[0][index])
          let boat_id =parseInt(result[0][index][objsymbol[0]].id)
          result[0][index]['id'] = boat_id;
        }
      // return response to requester
      if (check == false) {
        return result[0];
      };

      // send response
      response.sendResponse(res, result[0], 200);
      }
      else { // No boats, send empty list

        // return response to requester
        if (check == false) {
          return result[0];
        };

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

  const getAllOwnerLoads = (res, owner) => {
    model.re
  }

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

  /**
   * Delete owner
   * @param {request} req 
   * @param {response} res 
   */
  const deleteOwner = (req, res) => {
    model.Remove('owners', parseInt(req.params.owner_id)) 
      .then((owner) => {
        return;
      });
  }

  /**
   * Gets owner by id
   * @param {request} req 
   * @param {response} res 
   */
  const getOwnerById = (req, res) => {
    // set owner id
    const owner_id = parseInt(req.params.owner_id);

    // Retrieve and return owner
    return model.Retrieve('owners', owner_id)
    .then(async (owner) => {
      if (owner[0] == undefined) {
        return false;
      }
      // Add id to owner
      owner[0].id = owner_id;

      // Get owner boats
      owner[0].boats = await getOwnerBoats(req, res, false);

      //  // Make a list of loads
      //  let loadsList = await model.RetrieveList('load', req)
      //  .then((loads) => {
      //    return loads[0];
      // });

      // console.log(loadsList);
      
      // // Get loads for all boats
      // owner[0]['boats'].forEach((element) => {
      //   // list of loads on boat to be returned
      //   let boatLoads = [];
      // })

      // // list of loads on boat to be returned
      // let boatLoads = [];

      // // Make a list of loads
      // let loadsList = await model.RetrieveList('load', req)
      //   .then((loads) => {
      //     return loads[0];
      //   });


      // // Check if load is on boats
      // loadsList.forEach(e => {
      //   if (e.carrier == boat_id) {
      //     // Set load id
      //     let i = e[Datastore.KEY].id;
      //     // Add load to load array
      //     boatLoads.push({
      //       id: i,
      //       item: e.item,
      //       self: url.generateUrl(req.protocol, req.get('host'), req.url, 'loads', i),
      //     });
      //   };
      // });
      

      return owner[0];
    });
  }

  module.exports = {
    insertOwner,
    getOwnerBoats,
    getAllOwnerPublicBoats,
    addIdToOwners,
    getOwnerById,
    deleteOwner
  }