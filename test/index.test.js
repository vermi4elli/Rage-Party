const { test, expect, describe, afterAll, afterEach } =
  require('@jest/globals');
//const { fastify } = require('../index');
const { start, close } = require('../index');

start();

describe('server test', () => {
  afterAll(() => {
    //fastify.close();
    close();
  });

  test('responds with success on request /register', async done => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/register'
    });

    expect(response.statusCode).toBe(200);
    expect(response.payload).toBe('{"a":"hello"}');
    done();
  });

  test('responds with success on request /', async done => {
    const response = await fastify.inject({
      method: 'GET',
      url: '/'
    });

    expect(response.statusCode).toBe(200);
    done();
  });

  test('responds with error on request /error', async done => {
    expect((await fastify.inject({
      method: 'GET',
      url: '/error'
    })).body).toMatch('500');
    done();
  });
});
