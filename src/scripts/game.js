import * as PIXI from 'pixi.js';
import { ScaleToWindow } from '../other/scaleWindow';
import { left, right, down, up, reloadButton } from './keyboard';
import { collisionType, contain } from './contain';

const renderer =
  PIXI.autoDetectRenderer({
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 0x1a1f1b,
    autoDensity: true
  });
document.body.appendChild(renderer.view);

window.addEventListener('resize', _ => {
  console.log('resizing...');
  ScaleToWindow(renderer.view);
});

// create the root of the scene graph
const stageLevel = new PIXI.Container();
// const stageMenu = new PIXI.Container();

const bulletTexture = PIXI.Texture.from('assets/bullet.png');
const mapTexture = PIXI.Texture.from('assets/levels/baseMap.png');
const defaultIcon = 'url(\'./assets/utils/crosshair.cur\'),auto';
const explosionTextures = [];
for (let i = 1; i <= 6; i++) {
  const texture = PIXI.Texture.from(
    './assets/explo_orange/explo_orange_' + i + '.png');
  explosionTextures.push(texture);
}
const playerRunLeft = [];
for (let i = 1; i <= 6; i++) {
  const texture = PIXI.Texture.from(
    './assets/hero/runLeft/hero ' + i + '.png');
  playerRunLeft.push(texture);
}
const playerRunRight = [];
for (let i = 1; i <= 6; i++) {
  const texture = PIXI.Texture.from(
    './assets/hero/runRight/hero ' + i + '.png');
  playerRunRight.push(texture);
}
const playerStaleLeft = PIXI.Texture.from(
  './assets/hero/runLeft/hero 6.png');
const playerStaleRight = PIXI.Texture.from(
  './assets/hero/runRight/hero 6.png');
const playerRunningLeft = new PIXI.extras.AnimatedSprite(playerRunLeft),
  playerRunningRight = new PIXI.extras.AnimatedSprite(playerRunRight);
playerRunningLeft.loop = true;
playerRunningRight.loop = true;

const ammoLeftStyle = new PIXI.TextStyle({
  fill: 'white',
  fontFamily: 'Impact',
  fontSize: 40,
  stroke: 'white'
});
const reloadStyle = new PIXI.TextStyle({
  fill: 'red',
  fontFamily: 'Impact',
  fontSize: 40,
  stroke: 'white'
});
const ammoLeftText = new PIXI.Text('12 / 12', ammoLeftStyle);
ammoLeftText.x = renderer.width / 10 * 9;
ammoLeftText.y = renderer.height / 7 * 6;
const reloadText = new PIXI.Text('PRESS \'R\' TO RELOAD', reloadStyle);
reloadText.x = renderer.width / 10 * 5;
reloadText.y = renderer.height / 7 * 6;
reloadText.visible = false;

// Add custom cursor styles
renderer.plugins.interaction.cursorStyles.default = defaultIcon;

// create a background
const dungeon = new PIXI.Sprite(mapTexture);
dungeon.scale.x = 2.7;
dungeon.scale.y = 2.7;
dungeon.position.x = 0;
dungeon.position.y = 0;

stageLevel.addChild(dungeon);

// create a new Sprite using the texture
let player = new PIXI.Sprite(playerStaleRight);
// move the sprite to the center of the screen
player.position.x = renderer.width / 2;
player.position.y = renderer.height / 2;
player.vx = 0;
player.vy = 0;
player.lastMouseHalf = 2;
player.scale.x = 1.5;
player.scale.y = 1.5;

const gunTimeout = 10;
player.shooting = false;
player.shootingTimeout = gunTimeout;

stageLevel.addChild(player);
stageLevel.interactive = true;
stageLevel.on('mousedown', _ => {
  player.shooting = true;
});
stageLevel.on('mouseup', _ => {
  player.shooting = false;
  player.shootingTimeout = gunTimeout;
});
// yet to make it modular
class BulletPool {
  constructor(texture, bulletAmount, bulletSpeed, reloadSpeed) {
    this.texture = texture;
    this.bulletPool = [];

    this.active = false;
    this.amount = bulletAmount;
    this.bulletsLeft = bulletAmount;
    this.speed = bulletSpeed;

    ammoLeftText.text = this.bulletsLeft + ' / ' + this.amount;

    this.reloadSpeed = reloadSpeed;
    this.isReloading = false;
    this.reloadCooldown = reloadSpeed;

    for (let i = 0; i < bulletAmount; i++) {
      const bullet = new PIXI.Sprite(this.texture);
      bullet.position.x = 0;
      bullet.position.y = 0;
      bullet.visible = false;
      bullet.scale.x = 1.5;
      bullet.scale.y = 1.5;
      bullet.direction = new PIXI.Point(0, 0);
      this.bulletPool.push(bullet);
      stageLevel.addChild(bullet);
    }
  }

  getBulletsLeft() {
    return this.bulletsLeft;
  }

  getBulletsAmount() {
    return this.amount;
  }

  getReloadSpeed() {
    return this.reloadSpeed;
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
        if (this.bulletPool[b].active &&
          (contain(this.bulletPool[b], dungeon).x !== collisionType.no ||
            contain(this.bulletPool[b], dungeon).y !== collisionType.no)) {
          console.log('x col: ' + contain(this.bulletPool[b], dungeon).x +
            '; y col: ' + contain(this.bulletPool[b], dungeon).y);
          this.bulletPool[b].visible = false;

          const explosion = new PIXI.extras.AnimatedSprite(explosionTextures);

          explosion.x = this.bulletPool[b].x;
          explosion.y = this.bulletPool[b].y;
          explosion.anchor.set(0.5);
          explosion.rotation = Math.random() * Math.PI;
          explosion.scale.set(0.2 + Math.random() * 0.2);
          explosion.loop = false;
          explosion.animationSpeed = 0.5;
          explosion.play();
          explosion.onComplete = () => stageLevel.removeChild(explosion);
          stageLevel.addChild(explosion);

          this.bulletPool[b].active = false;
        }
        if (this.bulletPool[b].active) {
          this.bulletPool[b].x +=
            this.bulletPool[b].direction.x * this.speed;
          this.bulletPool[b].y +=
            this.bulletPool[b].direction.y * this.speed;
        }
      }
    }
    if (this.isReloading && this.reloadCooldown > 0) {
      reloadText.text = 'WAIT';
      --this.reloadCooldown;
    } else if (this.isReloading && this.reloadCooldown === 0) {
      this.isReloading = false;
      this.bulletsLeft = this.amount;
      ammoLeftText.text = this.bulletsLeft + ' / ' + this.amount;
      reloadText.visible = false;
    }
  }

  shoot(mX, mY) {
    if (!this.isReloading && this.bulletsLeft > 0) {
      const bullet = this.next();
      --this.bulletsLeft;

      ammoLeftText.text = this.bulletsLeft + ' / ' + this.amount;

      bullet.direction.x = mX - player.x;
      bullet.direction.y = mY - player.y;

      const length = Math.sqrt(
        bullet.direction.x * bullet.direction.x +
        bullet.direction.y * bullet.direction.y);
      bullet.direction.x /= length;
      bullet.direction.y /= length;

      bullet.position.x = player.x + player.width / 5;
      bullet.position.y = player.y + player.height / 3;

      bullet.active = true;
    } else if (!this.isReloading && this.bulletsLeft === 0) {
      reloadText.text = 'PRESS \'R\' TO RELOAD';
      reloadText.visible = true;
    }
  }

  reload() {
    this.isReloading = true;
    this.reloadCooldown = this.reloadSpeed;
  }

}
const bulletAmount = 10;
const bulletSpeed = 8;
const reloadSpeed = 80;

const playerBulletPool =
  new BulletPool(bulletTexture, bulletAmount, bulletSpeed, reloadSpeed);

// character control
const linearSpeed = 7;

left.press = () => player.vx -= linearSpeed;
left.release = () => player.vx += linearSpeed;

up.press = () => player.vy += linearSpeed;
up.release = () => player.vy -= linearSpeed;

right.press = () => player.vx += linearSpeed;
right.release = () => player.vx -= linearSpeed;

down.press = () => player.vy -= linearSpeed;
down.release = () => player.vy += linearSpeed;

reloadButton.press = () => playerBulletPool.reload();

function MoveCreature(creature) {
  const playerCollisions = contain(creature, dungeon);

  if (playerCollisions.x === collisionType.no ||
    ((playerCollisions.x === collisionType.left) && (player.vx >= 0)) ||
    ((playerCollisions.x === collisionType.right) && (player.vx <= 0))
  ) {
    creature.x += creature.vx;
  }
  if (playerCollisions.y === collisionType.no ||
    ((playerCollisions.y === collisionType.top) && (player.vy <= 0)) ||
    ((playerCollisions.y === collisionType.down) && (player.vy >= 0))
  ) {
    creature.y -= creature.vy;
  }
}

function AnimatePlayer(mouseX) {

  const x = player.x,
    y = player.y,
    half = (mouseX >= renderer.width / 2 ? 2 : 1);

  console.log('im here');
  if (player.lastMouseHalf !== half) {
    if (mouseX >= player.x) {
      player = playerRunningRight;
      player.play();
      console.log('right run');
    } else {
      player = playerRunningLeft;
      player.play();
      console.log('left run');
    }
    // if (player.vx === 0 && player.vy === 0) {
    //   player = new PIXI.Sprite((mouseX >= player.x ?
    //     playerStaleRight : playerStaleLeft));
    //   console.log('stale: vx = ' + player.vx + '; vy = ' + player.vy);
    // }
  }
  player.x = x;
  player.y = y;
  player.lastMouseHalf = half;

  console.log('passed this');

  return player;
}

stageLevel.addChild(ammoLeftText);
stageLevel.addChild(reloadText);

// start animating
ScaleToWindow(renderer.view);
animate();
function animate() {
  MoveCreature(player);
  playerBulletPool.updateBulletsSpeed();
  if (player.shooting) {

    if (player.shootingTimeout === gunTimeout) {
      player.shootingTimeout = 0;
      playerBulletPool.shoot(
        renderer.plugins.interaction.mouse.global.x,
        renderer.plugins.interaction.mouse.global.y
      );
    }
    ++player.shootingTimeout;
  }
  AnimatePlayer(renderer.plugins.interaction.mouse.global.x);

  // render the container
  renderer.render(stageLevel);
  requestAnimationFrame(animate);
}

module.exports = {
  stageLevel,
  player,
  playerBulletPool,
  dungeon,
  playerRunningRight,
  playerRunningLeft,
  renderer,
  AnimatePlayer
};
