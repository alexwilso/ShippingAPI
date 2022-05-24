/**
 * Class that generates and sends resposne to client
 */ 
class Response {

  /*
  * Sends response without Json
  * 
  */
  sendResponse(response, responseMessage, statusCode){
    response
      .status(statusCode)
      .setHeader('content-type', 'application/json')
      .send(responseMessage)
      .end();
  };

} module.exports = new Response();