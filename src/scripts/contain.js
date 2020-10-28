export const collisionType = {
  no: 0,
  top: 1,
  right: 2,
  down: 3,
  left: 4
};

export function contain(sprite, container) {

  const collision = {
    x: collisionType.no,
    y: collisionType.no
  };

  //Left
  if (container.x >= sprite.x - 95) {
    collision.x = collisionType.left;
  }

  // Right
  if (sprite.position.x + sprite.width + 95 >=
    container.position.x + container.width) {
    collision.x = collisionType.right;
  }

  //Top
  if (sprite.position.y - 90 + (sprite.height * 0.5) <= container.position.y) {
    collision.y = collisionType.top;
  }

  // Down
  if (sprite.position.y + sprite.height + 90 >=
    container.position.y + container.height) {
    collision.y = collisionType.down;
  }

  return collision;
}
