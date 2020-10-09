'use strict';

const collisionType = {
  no: 0,
  top: 1,
  right: 2,
  down: 3,
  left: 4
};

function checkCollisionX(sprite, container) {
  let collision;

  if (sprite.x === container.x) {
    collision = collisionType.left;
  }

  if (sprite.x + sprite.width > container.width) {
    collision = collisionType.right;
  }

  return collision;
}

function contain(sprite, container) {

  let collision = {
    x: collisionType.no,
    y: collisionType.no
  };

  //Left
  if (sprite.x - sprite.transform.width / 2 === container.x) {
    collision.x = collisionType.left;
  }

  // Right
  if (sprite.x + sprite.transform.width / 2 === container.x + container.width) {
    collision.x = collisionType.right;
  }

  //Top
  if (sprite.y - sprite.transform.height / 2 === container.y) {
    collision.y = collisionType.top;
  }

  // Down
  if (sprite.y + sprite.transform.height / 2 === container.y + container.height) {
    collision.y = collisionType.down;
  }

  return collision;
}
