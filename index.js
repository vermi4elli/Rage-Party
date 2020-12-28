'use strict';

const fastify = require('fastify')({ logger: true });
const path = require('path');
const port = /*process.env.PORT ||*/ 3000;
const host = port === 3000 ? '127.0.0.1' : '0.0.0.0';
// const db = require('./src/db/db');

fastify.register(require('fastify-static'), {
  root: path.join(__dirname),
  default: '/'
});

const { Pool } = require('pg');
const pool = new Pool({
  connectionString: process.env.DATABASE_URL + '?ssl=true',
  ssl: {
    rejectUnauthorized: false
  }
});

// Declare a route
fastify.get('/', async (req, res) => (res.sendFile('index.html')));
fastify.get('/scores', async (req, res) => {
  try {
    const client = await pool.connect();
    client.query('select name, score from scores;', (error, results) => {
      if (error) {
        throw error;
      }
      res.send(results.rows);
    });
    client.release();
  } catch (err) {
    console.error(err);
    res.send('Error ' + err);
  }
});
fastify.post('/scores', async (req, res) => {
  try {
    const client = await pool.connect();
    const { name, score } = req.body;
    client.query(
      `insert into scores (name, score) VALUES (${1}, ${2})`,
      [name, score],
      (error, result) => {
        if (error) {
          throw error;
        }
        console.log('request', req);
        res.status(200).send('User added');
      }
    );
  } catch (err) {
    console.error(err);
    res.send('Error ' + err);
  }
});

// Run the server!
const start = async () => {
  try {
    await fastify.listen(port, host);
    fastify.log.info(`server listening on ${fastify.server.address().port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();

module.exports = {
  fastify
};
