'use strict';

/* eslint-disable no-undef */

const renderer =
  PIXI.autoDetectRenderer(window.innerWidth,
    window.innerHeight,
    { backgroundColor: 0x1099bb });
document.body.appendChild(renderer.view);

// create the root of the scene graph
const stage = new PIXI.Container();

// create a background
const dungeon = new PIXI.Sprite(mapTexture);
dungeon.scale.x = 3;
dungeon.scale.y = 3;
stage.addChild(dungeon);


// create a new Sprite using the texture
const player = new PIXI.Sprite(bunnyTexture);

// move the sprite to the center of the screen
player.position.x = renderer.width / 2;
player.position.y = renderer.height / 2;
player.vx = 0;

player.vy = 0;
const gunTimeout = 10;
player.shooting = false;

player.shootingTimeout = gunTimeout;

// background.beginFill(0x123456);
// background.drawRect(0, 0, 800, 600);
// background.endFill();
// const background = new PIXI.Graphics();

// stage.addChild(background);
stage.addChild(player);

stage.interactive = true;

stage.on('mousedown', _ => {
  player.shooting = true;
});

stage.on('mouseup', _ => {
  player.shooting = false;
  player.shootingTimeout = gunTimeout;
});

// yet to make it modular
class BulletPool {
  constructor(texture, bulletAmount, bulletSpeed) {
    this.texture = texture;

    this.active = false;
    this.amount = bulletAmount;
    this.speed = bulletSpeed;
    this.bulletPool = [];

    for (let i = 0; i < bulletAmount; i++) {
      const bullet = new PIXI.Sprite(this.texture);
      bullet.visible = false;
      this.bulletPool.push(bullet);
      stage.addChild(bullet);
    }
  }

  next() {
    this.active = true;
    const bulletNext = this.bulletPool.pop();
    bulletNext.visible = true;
    this.bulletPool.unshift(bulletNext);
    return bulletNext;
  }

  updateBulletsSpeed() {
    if (this.active) {
      for (let b = this.bulletPool.length - 1; b >= 0; b--) {
        this.bulletPool[b].position.x +=
          Math.cos(this.bulletPool[b].rotation) * this.speed;
        this.bulletPool[b].position.y +=
          Math.sin(this.bulletPool[b].rotation) * this.speed;
      }
    }
  }
}
const bulletSpeed = 10;
const bulletAmount = 10;
const bulletPool = new BulletPool(bulletTexture, bulletAmount, bulletSpeed);

function shoot(rotation, startPosition) {
  const bullet = bulletPool.next();
  bullet.position.x = startPosition.x;
  bullet.position.y = startPosition.y;
  bullet.scale.x = 0.2;
  bullet.scale.y = 0.2;
  bullet.rotation = rotation;
}

function rotateToPoint(mx, my, px, py) {
  const distY = my - py;
  const distX = mx - px;
  return Math.atan2(distY, distX); // the angle
}

function MovePlayer() {
  const playerCollisions = contain(player, dungeon);

  console.log('pW: ' + player.width + '; pH: ' + player.height +
    '; dW: ' + dungeon.width + '; dH: ' + dungeon.height +
    '; ppX: ' + player.position.x + '; ppY' + player.position.y +
    '; pX: ' + player.x + '; pY: ' + player.y +
    '; dpX: ' + dungeon.position.x + '; dpY' + dungeon.position.y +
    '; dX: ' + dungeon.x + '; dY: ' + dungeon.y
  );

  if (playerCollisions.x === collisionType.no ||
    ((playerCollisions.x === collisionType.left) && (player.vx >= 0)) ||
    ((playerCollisions.x === collisionType.right) && (player.vx <= 0))
  ) {
    console.log('x is true');
    dungeon.position.x -= player.vx;
  }
  if (playerCollisions.y === collisionType.no ||
    ((playerCollisions.y === collisionType.top) && (player.vy <= 0)) ||
    ((playerCollisions.y === collisionType.down) && (player.vy >= 0))
  ) {

    console.log('y is true');
    dungeon.position.y += player.vy;
  }
}

// start animating
animate();
function animate() {

  MovePlayer();

  if (player.shooting) {

    if (player.shootingTimeout === gunTimeout) {
      player.shootingTimeout = 0;
      shoot(rotateToPoint(renderer.plugins.interaction.mouse.global.x,
        renderer.plugins.interaction.mouse.global.y,
        player.position.x,
        player.position.y),
      {
        x: player.position.x,
        y: player.position.y
      }
      );
    }
    ++player.shootingTimeout;
  }
  bulletPool.updateBulletsSpeed();

  // render the container
  renderer.render(stage);

  requestAnimationFrame(animate);
}
