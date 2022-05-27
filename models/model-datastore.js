'use strict';

const {Datastore} = require('@google-cloud/datastore');
// const ds = require('../datastore');

// Instantiate a datastore client
const datastore = new Datastore({
    projectId: 'assignment6-349118',
  });


/**
 * Insert a entity into the database
 *
 * @param string key in datastore
 * @param {object} value The boat to insert.
 */
const Insert = (key, value) => {
    return datastore.insert({
      key: datastore.key(key),
      data: value,
    });
  };

/**
 * Get entity/list of entities from datastore
 *
 * @param string key in datastore
 * @param id int of item id in datastore
 */
const Retrieve = async (key, id, req) => {

  // Getting list of all entities
  if (id == null) {

    // Set limit
    var query = datastore.createQuery(key).limit(5);

    // If cursor in parameter
    if (Object.keys(req.query).includes('cursor')){
      // Remove / from cursor
      let cursor = (req.query.cursor).substring(1);;

      // set query start
      query = await query.start(cursor);
    };

    // Run query
    return datastore.runQuery(query);

  } else { // Getting single entity
    // Get a item using id
    const itemKey = datastore.key([key, id]);
    return datastore.get(itemKey);
  }
}

/**
 * Update entity in datastore
 *
 * @param string key in datastore
 * @param id int of item id in datastore
 */
const Update = (key, value, id) => {
  // Build information about entity
  const itemKey = datastore.key([key, id]);
  const entity = {
    key: itemKey,
    data: value
  };
  // Update entity
  return datastore.update(entity);
}
 
/**
 * Delete entity from datastore
 *
 * @param string key in datastore
 * @param id int of item id in datastore
 */
const Remove = (key, id) => {
  const itemKey = datastore.key([key, id]);

  return datastore.delete(itemKey);
}



/**
 * Get entity/list of entities from datastore
 *
 * @param key key in datastore
 * @param req int of item id in datastore
 */
const RetrieveList = (key, req) => {

  const query = datastore.createQuery(key);
  return datastore.runQuery(query);
};

/**
 * Get entity/list of entities from datastore
 *
 * @param key key in datastore
 * @param req int of item id in datastore
 */
 const RetrieveOwners = (key, owner, onlyPublic) => {

  // Not owner making request, get all public boats for owner
  if (onlyPublic == true) {
    const query = datastore.createQuery(key)
      .filter('owner', owner)
      .filter('public', 'true');
    return datastore.runQuery(query);
  } else { // get all boats for owner provided
    const query = datastore.createQuery(key)
    .filter('owner', owner);
  return datastore.runQuery(query);
  }

}

/**
 * Get entity/list of entities from datastore
 *
 * @param key key in datastore
 * @param req int of item id in datastore
 */
const Unique = (key, req) => {
  let name = req.body.name;
  const query = datastore
    .createQuery(key)
    .filter('name', '=', name);
    return datastore.runQuery(query);
  };

  module.exports = {
    Insert,
    Retrieve,
    Remove,
    Update,
    RetrieveList,
    Unique,
    RetrieveOwners
  };