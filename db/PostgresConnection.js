'use strict';
exports.__esModule = true;
exports.createConnection = void 0;
require('dotenv').config();
var Client = require('pg').Client;
var client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});
client.connect()
    .then(function () {
    console.log('Connection to remote DB is working...');
});
var createConnection = function () {
    return {
        connection: function () { return client; }
    };
};
exports.createConnection = createConnection;
module.exports = client;
