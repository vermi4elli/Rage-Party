'use strict';

const fastify = require('fastify')({ logger: true });
const path = require('path');
const port = process.env.PORT || 3000;
const host = port === 3000 ? '127.0.0.1' : '0.0.0.0';

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

fastify.get('/error', async () => {
  throw new Error('error occurred!!!');
  //reply.send(new Error('error occurred!!!'));
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

const close = async () => {
  fastify.close();
};

module.exports = {
  start,
  close
};
