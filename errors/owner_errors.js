const response = require('../utility/response');

class ownersErrors{
  /**
   * Unauthorized error post
   */
  postError(res){
    // Set error message
    let message = JSON.stringify({Error :"Invalid Token"});

    // Send Response
    response.sendResponse(res, message, 401);
  };

    /**
   * Check if owner exist
   */
     checkExist(res, ownersList, sub){

      // Check if owner exist
      for (let i = 0; i < ownersList.length; i++) {
        const element = ownersList[i];
        
        // If owner exist
        if (element.sub === sub) {
          // Set error and send response
          this.ownerExist(res);

          return true;
        }
      }
      return false;
  };

  /**
   * Owner already exist
   */
    ownerExist(res){

      // Set error message
      let message = JSON.stringify({Error :"Owner already exist"});

      // Send response
      response.sendResponse(res, message, 400);
    };

    /**
     * Owner does not exist
     */
    ownerDoesNotExist(res, owner){

      // Owner does not exist
      if (owner == undefined || owner == false) {

        // Build message and send response
        let message = JSON.stringify({
          Error: "The specified owner does not exist"});

          // Send Response
          response.sendResponse(res, message, 404);
          return true;
      };
      return false;
    };

    /**
     * Checks if owner making request, if not sends error and returns true
     * @param {response} res 
     * @param {owner object} owner 
     */
    invalidPermission(req, res, owner){

      // Check if owner making request
      if (owner['sub'] != req.user.sub) {
        // Build message and send response
        let message = JSON.stringify({
        Error: "Must be owner to access"});
        response.sendResponse(res, message, 403);
        return true;
      };
      return false;
    }

} module.exports = new ownersErrors();

