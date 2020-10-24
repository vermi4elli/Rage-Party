'use strict';

import * as PIXI from 'pixi.js';
import { keyboard } from './keyboard';

const renderer =
  PIXI.autoDetectRenderer(window.innerWidth,
    window.innerHeight,
    { backgroundColor: 0x000000 });
document.body.appendChild(renderer.view);

// create the root of the scene graph
const stage = new PIXI.Container();

const bunnyTexture = PIXI.Texture.fromImage('assets/bunny.png');
const bulletTexture = PIXI.Texture.fromImage('assets/bullet.png');
const mapTexture = PIXI.Texture.fromImage('assets/levels/baseMap.png');

// create a background
const dungeon = new PIXI.Sprite(mapTexture);
dungeon.scale.x = 2.7;
dungeon.scale.y = 2.7;

stage.addChild(dungeon);

// create a new Sprite using the texture
export const player = new PIXI.Sprite(bunnyTexture);

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

  //ScreenShake(10);
}

// character control
const linearSpeed = 7;

const left = keyboard('a'),
  up = keyboard('w'),
  right = keyboard('d'),
  down = keyboard('s');

left.press = () => player.vx -= linearSpeed;
left.release = () => player.vx += linearSpeed;

up.press = () => player.vy += linearSpeed;
up.release = () => player.vy -= linearSpeed;

right.press = () => player.vx += linearSpeed;
right.release = () => player.vx -= linearSpeed;

down.press = () => player.vy -= linearSpeed;
down.release = () => player.vy += linearSpeed;

function ScreenShake(shake) {
  dungeon.position.x += shake;
  dungeon.position.y += shake;
}

function MovePlayer() {
  const playerCollisions = contain(player, dungeon);

  if (playerCollisions.x === collisionType.no ||
    ((playerCollisions.x === collisionType.left) && (player.vx >= 0)) ||
    ((playerCollisions.x === collisionType.right) && (player.vx <= 0))
  ) {
    console.log('x is true');
    player.x += player.vx;
  }
  if (playerCollisions.y === collisionType.no ||
    ((playerCollisions.y === collisionType.top) && (player.vy <= 0)) ||
    ((playerCollisions.y === collisionType.down) && (player.vy >= 0))
  ) {

    console.log('y is true');
    player.y -= player.vy;
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
