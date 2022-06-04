const response = require('../utility/response');

class boatErrors {
  
  /**
   * Requesting permission to view a private boat
   * 
   */
  privateBoat(res){
    // Json Message
    let errorMessage = {
    "Error": "Only boat owner can view this boat"
  };

  // Send response to client
  response.sendResponse(res, errorMessage, 403);
  }

  /**
   * Requesting permission on boat user does not own
   */
  wrongOwner(requester, owner, res){
    // If user does not own boat
    if (requester != owner) {
      let errorMessage = JSON.stringify({
        "Error": "invalid permission..."
      });
      
      // send error
      response.sendResponse(res, errorMessage, 401);
      return true;
    };
    return false;
  }
  

  /**
   * Boat does not exist
   */
  nonexistingBoatError(res){
  
    // Build message
    let message = JSON.stringify({
      Error: "No boat with this boat_id exists"
    });

    // Send response
    response.sendResponse(res, message, 404);
  }

} module.exports = new boatErrors();