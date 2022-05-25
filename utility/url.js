/**
 * Class that generates url for request
 */ 
class url {

  /**
   * 
   * @returns formatted url
   */
  generateUrl(protocol, host, baseUrl, entity, id){
    
    return `${protocol}://${host}/${entity}/${id}`
  }

} module.exports = new url();