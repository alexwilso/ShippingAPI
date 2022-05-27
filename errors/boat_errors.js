const response = require('../utility/response');

class boatErrors {
  
  /**
   * Requesting permission to view a private boat
   * 
   */
  privateBoat(res){
    // Json Message
    let errorMessage = {
    "Error": "invalid permission..."
  };

  // Send response to client
  response.sendResponse(res, errorMessage, 401);
  }
  

} module.exports = new boatErrors();