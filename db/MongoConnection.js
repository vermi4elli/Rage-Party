'use strict';
exports.__esModule = true;
exports.createConnection = void 0;
var MongoClient = require('mongodb').MongoClient;
require('dotenv').config();
var uri = process.env.MONGO_DB_URL;
var client = new MongoClient(uri, { useNewUrlParser: true });
client.connect();
var createConnection = function () {
    return {
        connection: function () { return client.db('jstrack'); }
    };
};
exports.createConnection = createConnection;
