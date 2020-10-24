'use strict';

const fastify = require('fastify')({ logger: true });
const path = require('path');

fastify.register(require('fastify-static'), {
  root: path.join(__dirname),
  default: '/'
  //prefix: '/public/', // optional:
});

// fastify.get('/', (req, reply) => {
//   // serving path.join(__dirname, 'public', 'myHtml.html') directly
//   reply.sendFile('index.html');
// });

// Declare a route
fastify.get('/', async (request, reply) =>
  (reply.sendFile('index.html')));

// Run the server!
const start = async () => {
  try {
    await fastify.listen(process.env.PORT || 3000);
    fastify.log.info(`server listening on ${fastify.server.address().port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
