'use strict';

require('dotenv').config();
const { Client } = require('pg');

const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

client
    .connect()
    .then(() => {
        console.log('Connection to remote DB is working...');
    });

export type PostgresConnection = {
    connection: () => any
};

export const createConnection = function (): PostgresConnection {
    return {
        connection: () => client
    }
};

//module.exports = client;
