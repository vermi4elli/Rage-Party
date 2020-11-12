export const collisionType = {
  no: 0,
  top: 1,
  right: 2,
  down: 3,
  left: 4
};

export function contain(sprite,
  container,
  offsetPercentage = 1,
  offsetX = 95,
  offsetY = 90
) {

  const collision = {
    x: collisionType.no,
    y: collisionType.no
  };

  //Left
  if (container.x >= sprite.x - offsetX * offsetPercentage) {
    collision.x = collisionType.left;
  }

  // Right
  if (sprite.position.x + sprite.width + offsetX * offsetPercentage >=
    container.position.x + container.width) {
    collision.x = collisionType.right;
  }

  //Top
  if (sprite.position.y - offsetY * offsetPercentage + (sprite.height * 0.5) <=
    container.position.y) {
    collision.y = collisionType.top;
  }

  // Down
  if (sprite.position.y + sprite.height + offsetY * offsetPercentage >=
    container.position.y + container.height) {
    collision.y = collisionType.down;
  }

  return collision;
}

export function checkCollision(object,
  target,
  offsetX = 0,
  offsetY = 0
) {
  const targetBoundLeft = target.x + target.width / 2 - offsetX,
    targetBoundRight = target.x + target.width / 2 + offsetX,
    targetBoundTop = target.y + target.height / 2 - offsetY,
    targetBoundBottom = target.y + target.height / 2 + offsetY;

  return object.x + object.width >= targetBoundLeft &&
    object.x <= targetBoundRight &&
    object.y + object.height >= targetBoundTop &&
    object.y <= targetBoundBottom;
}
