/**
 * Class that generates errorsand sends resposne to client
 */ 
class errors {

  /*
  * Checks whether boat passed contains all attributes
  */
  checkBoat(value){
    const attributes = ["name", "type", "length", "public"];
    
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
  };

  /*
  * Checks whether key is unique
  */
  isUnique(key, req){
    return new Promise((resolve, reject) => {
    model.Unique(key, req)
      .then((respone) => {
        // Query returns no results, name is unique
        if (respone[0].length == 0) {
          resolve(true);
        } else { // Name is not unique
          reject();
        }
      });
    });

  }

  /*
  * Checks whether value is number
  */
  isNumber(length){
    if (typeof length == 'number') {
      return true;
    } else {
      return false;
    }
  };

  /*
  * Checks whether value is string
  */
  isString(name){
    if (typeof name == 'string') {
      return true;
    } else {
      return false;
    }
  };

  /*
  * Checks whether value is null
  */
  isNull(value){
    // value is null
    if (value === null){
      return true;
    } else {
      return false;
    }
  };

  /*
  * Checks request header for accepts application/json data
  */
  jsonAccepts(req){

    if (req.headers.accept == "application/json" || req.headers.accept == '*/*') {
      return true;
    }
    return false;
  };

} module.exports = new errors();