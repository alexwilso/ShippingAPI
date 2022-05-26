const response = require('../utility/response');

class ownersErrors{
  /**
   * Unauthorized error post
   */
  postError(res){
    // Set error message
    let message = JSON.stringify({Error :"Unauthorized User"});

    // Send Response
    response.sendResponse(res, message, 401);
  };

} module.exports = new ownersErrors();

