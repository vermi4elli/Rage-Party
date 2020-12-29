'use strict';

require('dotenv').config();
const fastify = require('fastify')({ logger: true });
const path = require('path');
const port = parseInt(process.env.PORT);
const host = port === 3000 ? '127.0.0.1' : '0.0.0.0';
const db = require('./built/MongoConnection');
const DBInterface = require('./built/DBInterface');

fastify.register(require('fastify-static'), {
  root: path.join(__dirname),
  default: '/'
});

// Declare a route
fastify.get('/', async (req, res) => (res.sendFile('index.html')));
fastify.get('/scores', async (req, res) => {
  const scores = await DBInterface.ScoresMongo(db.createConnection())
    .getScores();
  res.status(200).send(scores);
});
fastify.get('/scores/:name', async (req, res) => {
  const name = req.query.name;
  const score = await DBInterface.ScoresMongo(db.createConnection())
    .getScoreByName(name);
  res.status(200).send(score);
});
fastify.post('/upload/:score', async (req, res) => {
  const { name, score } = req.query;
  const answer = await DBInterface.ScoresMongo(db.createConnection())
    .uploadScore(name, score);
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

module.exports = {
  fastify
};
