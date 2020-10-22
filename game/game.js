'use strict';

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

      bullet.direction = new PIXI.Point(0, 0);
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
        this.bulletPool[b].x +=
          this.bulletPool[b].direction.x * this.speed;
        this.bulletPool[b].y +=
          this.bulletPool[b].direction.y * this.speed;

        // moving accordingly to the dungeon move
        this.bulletPool[b].x -= player.vx;
        this.bulletPool[b].y += player.vy;
      }
    }
  }
}
const bulletSpeed = 10;
const bulletAmount = 10;
const bulletPool = new BulletPool(bulletTexture, bulletAmount, bulletSpeed);

function shoot(mX, mY) {
  const bullet = bulletPool.next();

  bullet.direction.x = mX - player.x;
  bullet.direction.y = mY - player.y;

  const length = Math.sqrt(
    bullet.direction.x * bullet.direction.x +
    bullet.direction.y * bullet.direction.y);
  bullet.direction.x /= length;
  bullet.direction.y /= length;

  bullet.position.x = player.x;
  bullet.position.y = player.y;
  bullet.scale.x = 0.2;
  bullet.scale.y = 0.2;
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
  bulletPool.updateBulletsSpeed();

  if (player.shooting) {
    if (player.shootingTimeout === gunTimeout) {
      player.shootingTimeout = 0;
      shoot(
        renderer.plugins.interaction.mouse.global.x,
        renderer.plugins.interaction.mouse.global.y
      );
    }
    ++player.shootingTimeout;
  }

  // render the container
  renderer.render(stage);

  requestAnimationFrame(animate);
}