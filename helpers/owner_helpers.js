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
        req.body['self'] = url.generateUrl(req.protocol, req.get('host'), req.url, 'loads', id)

        response.sendResponse(res, req.body, 201);
      });
  };


  module.exports = {
    insertOwner
  }