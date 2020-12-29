'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.createConnection = void 0;
const MongoClient = require('mongodb').MongoClient;
require('dotenv').config();
const uri = process.env.MONGO_DB_URL;
const client = new MongoClient(uri, { useNewUrlParser: true });
client.connect()
    .then(() => {
    console.log('Connection to remote DB is working...');
});
const createConnection = () => {
    return {
        connection: () => { return client.db('jstrack'); }
    };
};
exports.createConnection = createConnection;
//# sourceMappingURL=MongoConnection.js.map