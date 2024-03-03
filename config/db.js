const { MongoClient } = require("mongodb");
const state = {
  db: null,
};
//or as an es module:
//import { MongoClient } from 'mongodb'
const url = "mongodb://127.0.0.1:27017";
//By default, localhost usually resolves to the IPv6 address (::1). MongoDB might not be configured to listen on
// IPv6 by default. Try using the specific IPv4 address (127.0.0.1:27017) in your connection string instead.
//Use this address instead of mongodb://localhost
const client = new MongoClient(url);
const dbName = "shopping";
module.exports.connect = async function () {
  state.db = await client.db(dbName);

  //if connect is not used using promise then use : await client.connect() in app.js and
  // make a (done)=>{} call back in connect()
  return new Promise((resolve, reject) => {
    if (state.db != null) {
      resolve(dbName);
    } else {
      reject(false);
    }
  });
};

module.exports.get = () => {
  return state.db;
};