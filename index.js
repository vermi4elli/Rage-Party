'use strict';

const Koa = require('koa');
const app = new Koa();
const Router = require('koa-router');
const router = new Router();

router.get('/', async ctx => {
  ctx.body = 'Hello, world!';
  console.log('Succeed!');
});

app.use(router.routes());
app.use(router.allowedMethods());

app.listen(1234);
