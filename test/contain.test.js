const { test, expect } = require('@jest/globals');
const { contain, collisionType } = require('../src/scripts/contain');

test('contain against correct input', () => {
  const sprite = {
    x: 12,
    y: 20
  };
  const col = {
    x: collisionType.left,
    y: collisionType.top
  };
  expect(contain(sprite, sprite)).toBe(col);
});
