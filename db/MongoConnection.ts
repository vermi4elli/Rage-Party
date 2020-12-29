'use strict';

const MongoClient = require('mongodb').MongoClient;
require('dotenv').config();

const uri = process.env.MONGO_DB_URL;
const client = new MongoClient(uri, { useNewUrlParser: true });
client.connect(() => {
    const collection = client.db('jstrack').collection('scores');
    // perform actions on the collection object
    client.close();
});
client.connect();

export type MongoConnection = {
    connection: () => any
};

export const createConnection = (): MongoConnection => {
    return {
        connection: () => { return client.db('jstrack') }
    }
};
