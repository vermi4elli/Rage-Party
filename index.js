'use strict';

const fastify = require('fastify')({ logger: true });
const path = require('path');
const port = process.env.PORT || 80;

fastify.register(require('fastify-static'), {
  root: path.join(__dirname),
  default: '/'
});

// Declare a route
fastify.get('/', async (request, reply) =>
  (reply.sendFile('index.html')));

fastify.get('/register', async (request, reply) => {
  reply.send({ a: 'hello' });
});

// Run the server!
const start = async () => {
  try {
    await fastify.listen(port, '0.0.0.0');
    fastify.log.info(`server listening on ${fastify.server.address().port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
