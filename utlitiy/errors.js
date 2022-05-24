/**
 * Class that generates errorsand sends resposne to client
 */ 
class errors {

  /*
  * Checks whether boat passed contains all attributes
  */
  checkBoat(value){
    const attributes = ["name", "type", "length"];
    
    // Returns true if all attributes are found
    return ((this.checkArray(value, attributes).length) == 0);
  }

  /*
  * Checks whether load passed contains all attributes
  */
  checkLoad(value){
    const attributes = ["volume", "item", "creation_date"];

    // Returns true if all attributes are found
    return ((this.checkArray(value, attributes).length) == 0);
  }

  /*
  * Loops through values object, removing keys from attributes array. Returns attributes array
  */
  checkArray(values, attributes){
    // Loops through values object removing them from array attributes array
    for (const key in values) {
      const index = attributes.indexOf(key);
      if (index > -1) {
        attributes.splice(index, 1); 
      };
    };

    return attributes;
  }

  // createHangUpError() {
  //   var error = new Error('socket hang up');
  //   error.code = 'ECONNRESET';
  //   return error;
  // }

} module.exports = new errors();