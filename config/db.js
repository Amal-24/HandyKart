const { MongoClient } = require("mongodb");
const state = {
  db: null,
};

const url = "mongodb://127.0.0.1:27017";

const client = new MongoClient(url);
const dbName = "shopping";
module.exports.connect = async function () {
  state.db = await client.db(dbName);
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