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

  const collision = {
    x: collisionType.no,
    y: collisionType.no
  };

  //Left
  if (container.x > sprite.x) {
    collision.x = collisionType.left;
  }

  // Right
  if (sprite.position.x + sprite.width >
    container.position.x + container.width) {
    collision.x = collisionType.right;
  }

  //Top
  if (sprite.position.y < container.position.y) {
    collision.y = collisionType.top;
  }

  // Down
  if (sprite.position.y + sprite.height >
    container.position.y + container.height) {
    collision.y = collisionType.down;
  }

  return collision;
}
