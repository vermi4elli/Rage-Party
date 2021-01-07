const { test, expect } = require('@jest/globals');
const { contain, collisionType } = require('../src/scripts/contain');

test('contain against correct input', () => {
  const sprite = {
    position: {
      x: 200,
      y: 200
    },
    width: 20,
    height: 20
  };
  const dungeon = {
    position: {
      x: 0,
      y: 0
    },
    width: 500,
    height: 500
  };
  const col = {
    x: collisionType.no,
    y: collisionType.no
  };
  expect(contain(sprite, dungeon)).toEqual(col);
});

test('contain against right down hit situation', () => {
  const sprite = {
    position: {
      x: 430,
      y: 430
    },
    width: 20,
    height: 20
  };
  const dungeon = {
    position: {
      x: 0,
      y: 0
    },
    width: 500,
    height: 500
  };
  const col = {
    x: collisionType.right,
    y: collisionType.down
  };
  expect(contain(sprite, dungeon)).toEqual(col);
});

test('contain against left top hit situation', () => {
  const sprite = {
    position: {
      x: 80,
      y: 80
    },
    width: 20,
    height: 20
  };
  const dungeon = {
    position: {
      x: 0,
      y: 0
    },
    width: 500,
    height: 500
  };
  const col = {
    x: collisionType.left,
    y: collisionType.top
  };
  expect(contain(sprite, dungeon)).toEqual(col);
});
