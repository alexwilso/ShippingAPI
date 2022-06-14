const response = require('../utility/response');

class LoadErrors {


  noLoadExist(res, load) {
    // Load does not exist
    if (load == false) {
      // Build message and send response
      let message = JSON.stringify({
      Error: "The specified load does not exist"});
      response.sendResponse(res, message, 404);
      return true;
    };
    return false;
  };

  


} module.exports = new LoadErrors();