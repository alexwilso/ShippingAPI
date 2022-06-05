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
  };

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
  };
  

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
  };

  /**
   * Private boat
   */
  privateBoatEror(res, boat){

    // if boat is private
    if (boat == "private") {
      // Set message and send response
      let message = JSON.stringify({
      Error: "Private boat, only owner can assign load to this boat"
      });
      response.sendResponse(res, message, 403);
      return true;
    };
    return false;
  };

  /**
   * Non existing boat/load
   */
  noLoadBoatExist(res, boat, load){

    // If boat and load don't exist
    if (!boat.exist || !load.exist) {
      // Build message and send response
      let message = JSON.stringify({
      Error: "The specified boat and/or load does not exist"});
      response.sendResponse(res, message, 404);
      return true;
    };
    return false;
  };

} module.exports = new boatErrors();