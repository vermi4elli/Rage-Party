'use strict';

require('dotenv').config();
const fastify = require('fastify')({ logger: true });
const path = require('path');
const port = parseInt(process.env.PORT);
const host = port === 3000 ? '127.0.0.1' : '0.0.0.0';
const db = require('./built/PostgresConnection');
const DBInterface = require('./built/ScoresPostgres');
const fastifyCors = require('fastify-cors');

fastify.register(require('fastify-static'), {
  root: path.join(__dirname),
  default: '/'
}).register(fastifyCors, {
  origin: '*',
  methods: 'GET,POST,PUT,DELETE,OPTIONS',
  allowedHeaders:
    'Content-Type,Access-Control-Allow-Headers,Authorization,X-Requested-With'
});

// Declare a route
fastify.get('/', async (req, res) =>
  res.status(200).sendFile('index.html'));
fastify.get('/scores', async (req, res) => {
  const scores = await DBInterface
    .DBScores(db.createConnection())
    .getScores();
  res.status(200).send(scores);
});
fastify.get('/scores/:name', async (req, res) => {
  const name = req.query.name;
  const score = await DBInterface
    .DBScores(db.createConnection())
    .getScoreByName(name);
  res.status(200).send(score);
});
fastify.post('/upload/:score', async (req, res) => {
  const { name, score } = req.query;
  const answer = await DBInterface
    .DBScores(db.createConnection())
    .uploadScore(name, score);
  console.log(answer);
  res.status(200).send('Score added: ' + answer);
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
