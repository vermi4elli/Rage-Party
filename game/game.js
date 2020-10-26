'use strict';

// import { keyboard } from './keyboard';

const renderer =
  PIXI.autoDetectRenderer({
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 0x1a1f1b,
    autoDensity: true
  });
document.body.appendChild(renderer.view);

// create the root of the scene graph
const stageLevel = new PIXI.Container();
const stageMenu = new PIXI.Container();

const bunnyTexture = PIXI.Texture.fromImage('assets/bunny.png');
const bulletTexture = PIXI.Texture.fromImage('assets/bullet.png');
const mapTexture = PIXI.Texture.fromImage('assets/levels/baseMap.png');
const defaultIcon = 'url(\'./assets/utils/crosshair.cur\'),auto';
const explosionTextures = [];
for (let i = 1; i <= 6; i++) {
  const texture = PIXI.Texture.from(
    './assets/explo_orange/explo_orange_' + i + '.png');
  explosionTextures.push(texture);
}
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
const player = new PIXI.Sprite(bunnyTexture);

// move the sprite to the center of the screen
player.position.x = renderer.width / 2;
player.position.y = renderer.height / 2;

player.vx = 0;
player.vy = 0;
player.scale.x = 1.5;
player.scale.y = 1.5;

const gunTimeout = 10;
player.shooting = false;

player.shootingTimeout = gunTimeout;

const collisionType = {
  no: 0,
  top: 1,
  right: 2,
  down: 3,
  left: 4
};

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

    this.reloadSpeed = reloadSpeed;
    this.isReloading = false;
    this.reloadCooldown = reloadSpeed;

    for (let i = 0; i < bulletAmount; i++) {
      const bullet = new PIXI.Sprite(this.texture);
      bullet.visible = false;

      bullet.direction = new PIXI.Point(0, 0);
      this.bulletPool.push(bullet);
      stageLevel.addChild(bullet);
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
        if (this.bulletPool[b].active &&
          (contain(this.bulletPool[b], dungeon).x !== collisionType.no ||
            contain(this.bulletPool[b], dungeon).y !== collisionType.no)) {
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
  }

  shoot(mX, mY) {
    if (!this.isReloading && this.bulletsLeft > 0) {
      const bullet = this.next();
      --this.bulletsLeft;

      bullet.direction.x = mX - player.x;
      bullet.direction.y = mY - player.y;

      const length = Math.sqrt(
        bullet.direction.x * bullet.direction.x +
        bullet.direction.y * bullet.direction.y);
      bullet.direction.x /= length;
      bullet.direction.y /= length;

      bullet.position.x = player.x + player.width / 5;
      bullet.position.y = player.y + player.height / 3;
      bullet.scale.x = 0.3;
      bullet.scale.y = 0.3;

      bullet.active = true;
    } else if (this.isReloading && this.reloadCooldown > 0) {
      --this.reloadCooldown;
    } else if (this.isReloading && this.reloadCooldown === 0) {
      this.isReloading = false;
      this.bulletsLeft = this.amount;
    }
  }

  reload() {
    this.isReloading = true;
    this.reloadCooldown = this.reloadSpeed;
  }

}
const bulletAmount = 10;
const bulletSpeed = 10;
const reloadSpeed = 8;
const playerBulletPool =
  new BulletPool(bulletTexture, bulletAmount, bulletSpeed, reloadSpeed);

function contain(sprite, container) {

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

// character control
const linearSpeed = 7;

const keyboard = value => {
  const key = {};
  key.value = value;
  key.isDown = false;
  key.isUp = true;
  key.press = undefined;
  key.release = undefined;
  //The `downHandler`
  key.downHandler = event => {
    if (event.code === key.value) {
      if (key.isUp && key.press) key.press();
      key.isDown = true;
      key.isUp = false;
      event.preventDefault();
    }
  };

  //The `upHandler`
  key.upHandler = event => {
    if (event.code === key.value) {
      if (key.isDown && key.release) key.release();
      key.isDown = false;
      key.isUp = true;
      event.preventDefault();
    }
  };

  //Attach event listeners
  const downListener = key.downHandler.bind(key);
  const upListener = key.upHandler.bind(key);

  window.addEventListener(
    'keydown', downListener, false
  );
  window.addEventListener(
    'keyup', upListener, false
  );

  // Detach event listeners
  key.unsubscribe = () => {
    window.removeEventListener('keydown', downListener);
    window.removeEventListener('keyup', upListener);
  };

  return key;
};

const left = keyboard('KeyA'),
  up = keyboard('KeyW'),
  right = keyboard('KeyD'),
  down = keyboard('KeyS'),
  reloadButton = keyboard('KeyR');

left.press = () => player.vx -= linearSpeed;
left.release = () => player.vx += linearSpeed;

up.press = () => player.vy += linearSpeed;
up.release = () => player.vy -= linearSpeed;

right.press = () => player.vx += linearSpeed;
right.release = () => player.vx -= linearSpeed;

down.press = () => player.vy -= linearSpeed;
down.release = () => player.vy += linearSpeed;

reloadButton.press = () => playerBulletPool.reload();

function MovePlayer() {
  const playerCollisions = contain(player, dungeon);

  if (playerCollisions.x === collisionType.no ||
    ((playerCollisions.x === collisionType.left) && (player.vx >= 0)) ||
    ((playerCollisions.x === collisionType.right) && (player.vx <= 0))
  ) {
    player.x += player.vx;
  }
  if (playerCollisions.y === collisionType.no ||
    ((playerCollisions.y === collisionType.top) && (player.vy <= 0)) ||
    ((playerCollisions.y === collisionType.down) && (player.vy >= 0))
  ) {
    player.y -= player.vy;
  }
}

// start animating
ScaleToWindow(renderer.view);
animate();
function animate() {
  MovePlayer();
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

  // render the container
  renderer.render(stageLevel);

  requestAnimationFrame(animate);
}
