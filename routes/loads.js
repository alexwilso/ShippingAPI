'use strict';

const express = require('express');
const bodyParser = require('body-parser');

const router = express.Router();

const model = require('../models/model-datastore');

const errors = require('../utility/errors');
const response = require('../utility/response');
const load_helper = require('../helpers/load_helper');

// Automatically parse request body as JSON
router.use(bodyParser.json({}));

 
 /**
 * POST /loads
 *
 * Allows you to create a new load.
 */
router.post('/', (req, res, next) => {

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
})

  /**
 * GET /loads/:load_id
 * 
 * Allows you to get an existing slip.
 */
router.get('/:load_id', (req, res, next) => {
  
  // Get load to send to client
  load_helper.getLoad(req, res, false);
});


  /**
 * GET /loads
 * 
 * List all the loads.
 */
router.get('/', (req, res, next) => {
  
  // Get all loads and send to client
  load_helper.getAllLoads(req, res);

});

/**
 * Put /loads/:/load_id
 * 
 * Edit a load
 */
router.put('/load/:load_id', (req, res, next) => {

});

  /**
 * DELETE /loads/:load_id
 * 
 * Deletes load. Updates boat that was carrying it.
 */
router.delete('/:load_id', async (req, res, next) => {

   // Get load
   let load = await load_helper.getLoad(req, res, true);

   // If load exist, delete it
   if (load.exist) {
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

   module.exports = router;