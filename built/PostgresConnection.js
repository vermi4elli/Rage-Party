'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.createConnection = void 0;
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
const createConnection = function () {
    return {
        connection: () => client
    };
};
exports.createConnection = createConnection;
//# sourceMappingURL=PostgresConnection.js.map