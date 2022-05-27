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
          // Set error message
          let message = JSON.stringify({Error :"Owner already exist"});

          // Send response
          response.sendResponse(res, message, 400);

          return true;
        }
      }
      return false;
  }

} module.exports = new ownersErrors();

