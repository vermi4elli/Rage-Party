'use strict';

const fastify = require('fastify')({ logger: true });
const path = require('path');

fastify.register(require('fastify-static'), {
  root: path.join(__dirname),
  default: '/'
  //prefix: '/public/', // optional:
});

fastify.get('/another/path', (req, reply) => {
  // serving path.join(__dirname, 'public', 'myHtml.html') directly
  reply.sendFile('index.html');
});

// fastify.get('/path/with/different/root', (req, reply) => {
//   // serving a file from a different root location
//   reply.sendFile('myHtml.html', path.join(__dirname, 'build'));
// });


// Declare a route
//fastify.get('/', async (request, reply) => ({ hello: 'world' }));

// Run the server!
const start = async () => {
  try {
    await fastify.listen(3000);
    fastify.log.info(`server listening on ${fastify.server.address().port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();
