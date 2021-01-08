'use strict';
Object.defineProperty(exports, "__esModule", { value: true });
exports.createConnection = void 0;
require('dotenv').config();
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
const createConnection = function () {
    return {
        connection: () => pool
    };
};
exports.createConnection = createConnection;
//# sourceMappingURL=PostgresConnection.js.map