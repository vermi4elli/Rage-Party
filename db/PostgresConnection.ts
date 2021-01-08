'use strict';

require('dotenv').config();
import * as pg from 'pg';
const { Pool } = require('pg');

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

pool
    .connect()
    .then(() => {
        console.log('Connection to remote DB is working...');
    });

export type PostgresConnection = {
    connection: () => pg.Pool
};

export const createConnection = function (): PostgresConnection {
    return {
        connection: () => pool
    }
};

//module.exports = client;
