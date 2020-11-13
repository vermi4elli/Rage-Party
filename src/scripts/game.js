import * as PIXI from 'pixi.js';
import { ScaleToWindow } from './scaleWindow';
import { keyboard } from './keyboard';
import { collisionType, contain, checkCollision } from './contain';

const renderer =
  PIXI.autoDetectRenderer({
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 0x1a1f1b,
    autoDensity: true
  });
document.body.appendChild(renderer.view);

window.addEventListener('resize', _ => {
  ScaleToWindow(renderer.view);
});

// create the root of the scene graph
const stageLevel = new PIXI.Container();
// const stageMenu = new PIXI.Container();

const bunnyTexture = PIXI.Texture.from('assets/bunny.png');
const playerBulletTexture = PIXI.Texture.from('assets/bullet.png');
const enemyBulletTexture = PIXI.Texture.from('assets/bullet_enemy.png');
const mapTexture = PIXI.Texture.from('assets/levels/baseMap.png');
const defaultIcon = 'url(\'./assets/utils/crosshair.cur\'),auto';

// EXPLOSION textures
const explosionOrangeTextures = [];
for (let i = 1; i <= 6; i++) {
  const texture = PIXI.Texture.from(
    './assets/explo_orange/explo_orange_' + i + '.png');
  explosionOrangeTextures.push(texture);
}
const explosionRedTextures = [];
for (let i = 1; i <= 6; i++) {
  const texture = PIXI.Texture.from(
    './assets/explo_red/explo_red_' + i + '.png');
  explosionRedTextures.push(texture);
}

// PLAYER running forward textures
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
// running backward textures
const playerRunLeftBack = [];
for (let i = 6; i >= 1; i--) {
  const texture = PIXI.Texture.from(
    './assets/hero/runLeft/hero ' + i + '.png');
  playerRunLeftBack.push(texture);
}
const playerRunRightBack = [];
for (let i = 6; i >= 1; i--) {
  const texture = PIXI.Texture.from(
    './assets/hero/runRight/hero ' + i + '.png');
  playerRunRightBack.push(texture);
}
const playerStaleLeft = [];
playerStaleLeft.push(PIXI.Texture.from(
  './assets/hero/runLeft/hero 6.png'));
const playerStaleRight = [];
playerStaleRight.push(PIXI.Texture.from(
  './assets/hero/runRight/hero 6.png'));
const playerRunningLeft = new PIXI.extras.AnimatedSprite(playerRunLeft),
  playerRunningRight = new PIXI.extras.AnimatedSprite(playerRunRight),
  playerRunningLeftBack = new PIXI.extras.AnimatedSprite(playerRunLeftBack),
  playerRunningRightBack = new PIXI.extras.AnimatedSprite(playerRunRightBack);
playerRunningLeft.loop = true;
playerRunningRight.loop = true;

// ENEMY running forward textures
const enemyRunLeft = [];
for (let i = 1; i <= 6; i++) {
  const texture = PIXI.Texture.from(
    './assets/enemy/runLeft/enemy_l_' + i + '.png');
  enemyRunLeft.push(texture);
}
const enemyRunRight = [];
for (let i = 1; i <= 6; i++) {
  const texture = PIXI.Texture.from(
    './assets/enemy/runRight/enemy_r_' + i + '.png');
  enemyRunRight.push(texture);
}
// running backward textures
const enemyRunLeftBack = [];
for (let i = 6; i >= 1; i--) {
  const texture = PIXI.Texture.from(
    './assets/enemy/runLeft/enemy_l_' + i + '.png');
  enemyRunLeftBack.push(texture);
}
const enemyRunRightBack = [];
for (let i = 6; i >= 1; i--) {
  const texture = PIXI.Texture.from(
    './assets/enemy/runRight/enemy_r_' + i + '.png');
  enemyRunRightBack.push(texture);
}
const enemyStaleLeft = [];
enemyStaleLeft.push(PIXI.Texture.from(
  './assets/enemy/runLeft/enemy_l_6.png'));
const enemyStaleRight = [];
enemyStaleRight.push(PIXI.Texture.from(
  './assets/enemy/runRight/enemy_r_6.png'));

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
const player = new PIXI.extras.AnimatedSprite(playerStaleRight);

player.position.x = renderer.width / 4;
player.position.y = renderer.height / 2;

player.vx = 0;
player.vy = 0;

player.scale.x = 1.5;
player.scale.y = 1.5;

const gunTimeout = 10;
player.shooting = false;
player.shootingTimeout = gunTimeout;
player.health = 100;
player.isAlive = true;

const playerState = {
  idleRight: 0,
  idleLeft: 1,
  runRight: 2,
  runLeft: 3,
  runRightBack: 4,
  runLeftBack: 5
};
player.state = playerState.idleRight;

stageLevel.addChild(player);

stageLevel.interactive = true;

stageLevel.on('mousedown', _ => {
  player.shooting = true;
});

stageLevel.on('mouseup', _ => {
  player.shooting = false;
  player.shootingTimeout = gunTimeout;
});

class BulletPool {
  constructor(
    bulletTexture,
    explosionTexture,
    bulletAmount,
    bulletSpeed,
    bulletDamage,
    reloadSpeed,
    sourceSprite
  ) {
    this.bulletTexture = bulletTexture;
    this.explosionTexture = explosionTexture;
    this.bulletPool = [];
    this.sourceSprite = sourceSprite;

    this.active = false;
    this.amount = bulletAmount;
    this.bulletsLeft = bulletAmount;
    this.speed = bulletSpeed;
    this.damage = bulletDamage;

    ammoLeftText.text = this.bulletsLeft + ' / ' + this.amount;

    this.reloadSpeed = reloadSpeed;
    this.isReloading = false;
    this.reloadCooldown = reloadSpeed;

    for (let i = 0; i < bulletAmount * 2; i++) {
      const bullet = new PIXI.Sprite(this.bulletTexture);
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

  getDamage() {
    return this.damage;
  }

  getReloadSpeed() {
    return this.reloadSpeed;
  }

  getBullet(index) {
    return this.bulletPool[index];
  }

  setBulletDestroyed(index) {
    this.bulletPool[index].destroyed = true;
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
          (contain(this.bulletPool[b], dungeon, 0.6).x !== collisionType.no ||
            contain(this.bulletPool[b], dungeon, 0.6).y !== collisionType.no)) {
          this.bulletPool[b].visible = false;

          const explosion =
            new PIXI.extras.AnimatedSprite(this.explosionTexture);

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
        if (this.bulletPool[b].destroyed) {
          this.bulletPool[b].destroyed = false;
          this.bulletPool[b].visible = false;
          this.bulletPool[b].active = false;

          const explosion =
            new PIXI.extras.AnimatedSprite(this.explosionTexture);
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
        }
        if (this.bulletPool[b].active) {
          this.bulletPool[b].x +=
            this.bulletPool[b].direction.x * this.speed;
          this.bulletPool[b].y +=
            this.bulletPool[b].direction.y * this.speed;
        }
      }
    }
    if (this.isReloading &&
      this.reloadCooldown > 0
    ) {
      if (this.sourceSprite === player) reloadText.text = 'WAIT';
      --this.reloadCooldown;
    } else if (this.isReloading && this.reloadCooldown === 0) {
      this.isReloading = false;
      this.bulletsLeft = this.amount;
      if (this.sourceSprite === player) {
        ammoLeftText.text = this.bulletsLeft + ' / ' + this.amount;
        reloadText.visible = false;
      }
    }
  }

  shoot(targetX, targetY, autoReload) {
    if (!this.isReloading && this.bulletsLeft > 0) {
      const bullet = this.next();
      --this.bulletsLeft;

      if (this.sourceSprite === player) {
        ammoLeftText.text = this.bulletsLeft + ' / ' + this.amount;
      }

      bullet.direction.x = targetX - this.sourceSprite.x;
      bullet.direction.y = targetY - this.sourceSprite.y;

      const length = Math.sqrt(
        bullet.direction.x * bullet.direction.x +
        bullet.direction.y * bullet.direction.y);
      bullet.direction.x /= length;
      bullet.direction.y /= length;

      bullet.position.x = this.sourceSprite.x + this.sourceSprite.width / 5;
      bullet.position.y = this.sourceSprite.y + this.sourceSprite.height / 3;

      bullet.active = true;
    } else if (autoReload &&
      this.bulletsLeft === 0 &&
      !this.isReloading) {
      this.reload();
    } else if (!this.isReloading &&
      this.bulletsLeft === 0 &&
      this.sourceSprite === player
    ) {
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
const bulletDamage = 20;

const playerBulletPool =
  new BulletPool(
    playerBulletTexture,
    explosionOrangeTextures,
    bulletAmount,
    bulletSpeed,
    bulletDamage,
    reloadSpeed,
    player
  );

class EnemyManager {
  constructor(
    enemyAmount,
    enemyHealth,
    enemyBulletAmount,
    enemyBulletSpeed,
    enemyBulletDamage,
    enemyReloadSpeed
  ) {
    this.enemies = [];

    for (let i = 0; i < enemyAmount; i++) {
      const enemyTemp = new PIXI.extras.AnimatedSprite(enemyStaleLeft);
      enemyTemp.position.x = player.x + 100 + Math.random() *
        (renderer.width - (player.x + 100 - dungeon.x) - 120);
      enemyTemp.position.y = dungeon.y + 90 + Math.random() *
        (renderer.height - 270);
      console.log('h: ' + renderer.height + '; w: ' + renderer.width +
        '; eX: ' + enemyTemp.x + '; eY: ' + enemyTemp.y);
      enemyTemp.scale.x = 1.5;
      enemyTemp.scale.y = 1.5;
      enemyTemp.visible = true;
      stageLevel.addChild(enemyTemp);

      const enemyBulletPool = new BulletPool(
        enemyBulletTexture,
        explosionRedTextures,
        enemyBulletAmount,
        enemyBulletSpeed,
        enemyBulletDamage,
        enemyReloadSpeed,
        enemyTemp);

      const enemyStruct = {
        active: true,
        enemy: enemyTemp,
        enemyHealth,
        enemyBulletPool,
        shootingTimeout: 0
      };

      this.enemies.push(enemyStruct);

      this.enemiesLeft = enemyAmount;
      this.enemiesAmount = enemyAmount;
    }
  }

  Execute() {
    if (this.enemiesLeft > 0) {
      for (let i = 0; i < this.enemiesAmount; i++) {
        if (this.enemies[i].active) {
          // check the player's bullets collision with this enemy
          for (let j = 0; j < playerBulletPool.getBulletsAmount(); j++) {
            if (playerBulletPool.getBullet(j).active &&
              !playerBulletPool.getBullet(j).destroyed &&
              checkCollision(
                playerBulletPool.getBullet(j),
                this.enemies[i].enemy,
                this.enemies[i].enemy.width / 4,
                this.enemies[i].enemy.height / 2)) {
              playerBulletPool.setBulletDestroyed(j);
              this.enemies[i].enemyHealth -= playerBulletPool.getDamage();

              // check if the enemy is killed after the shot
              if (this.enemies[i].enemyHealth <= 0) {
                this.enemies[i].active = false;
                this.enemies[i].enemy.visible = false;
                stageLevel.removeChild(this.enemies[i].enemy);
                this.enemiesLeft--;
              }
            }
          }

          // try to fire bullets
          if (this.enemies[i].active && player.isAlive) {
            if (this.enemies[i].shootingTimeout === gunTimeout) {
              this.enemies[i].shootingTimeout = 0;
              this.enemies[i].enemyBulletPool.shoot(player.x, player.y, true);
            } else {
              ++this.enemies[i].shootingTimeout;
            }
          }
        }

      }
    }
    for (let i = 0; i < this.enemiesAmount; i++) {
      for (let j = 0;
        j < this.enemies[i].enemyBulletPool.getBulletsAmount();
        j++) {
        if (this.enemies[i].enemyBulletPool.getBullet(j).active &&
          !this.enemies[i].enemyBulletPool.getBullet(j).destroyed &&
          player.isAlive &&
          checkCollision(
            this.enemies[i].enemyBulletPool.getBullet(j),
            player,
            player.width / 4,
            player.height / 2)) {
          this.enemies[i].enemyBulletPool.setBulletDestroyed(j);
          player.health -=
            this.enemies[i].enemyBulletPool.getDamage();

          // check if the player is killed after the shot
          if (player.health <= 0) {
            player.active = false;
            player.visible = false;
            player.isAlive = false;
            stageLevel.removeChild(player);
          }
        }
      }

      // updating this enemies bullets even if the enemy is dead
      this.enemies[i].enemyBulletPool.updateBulletsSpeed();
    }
  }
}

const enemyManager = new EnemyManager(
  5,
  100,
  5,
  6,
  20,
  80);

// character control
const linearSpeed = 4;

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

function MoveCreature(creature) {
  const creatureCollisions = contain(creature, dungeon);

  if (creatureCollisions.x === collisionType.no ||
    ((creatureCollisions.x === collisionType.left) && (creature.vx >= 0)) ||
    ((creatureCollisions.x === collisionType.right) && (creature.vx <= 0))
  ) {
    creature.x += creature.vx;
  }
  if (creatureCollisions.y === collisionType.no ||
    ((creatureCollisions.y === collisionType.top) && (creature.vy <= 0)) ||
    ((creatureCollisions.y === collisionType.down) && (creature.vy >= 0))
  ) {
    creature.y -= creature.vy;
  }
}

function AnimatePlayer(mouseX) {
  const half = (mouseX >= player.x ? 2 : 1),
    moving = player.vx !== 0 || player.vy !== 0;
  const newState = (moving ?
    (half === 2 ?
      (player.vx >= 0 ?
        playerState.runRight :
        playerState.runRightBack) :
      (player.vx < 0 ?
        playerState.runLeft :
        playerState.runLeftBack)
    ) :
    (half === 2 ? playerState.idleRight : playerState.idleLeft));

  if (player.state !== newState) {
    switch (newState) {
    case playerState.idleRight:
      player.textures = playerStaleRight;
      player.loop = true;
      player.play();
      break;
    case playerState.idleLeft:
      player.textures = playerStaleLeft;
      player.loop = true;
      player.play();
      break;
    case playerState.runRight:
      player.textures = playerRunRight;
      player.loop = true;
      player.animationSpeed = 0.1;
      player.play();
      break;
    case playerState.runLeft:
      player.textures = playerRunLeft;
      player.loop = true;
      player.animationSpeed = 0.1;
      player.play();
      break;
    case playerState.runRightBack:
      player.textures = playerRunRightBack;
      player.loop = true;
      player.animationSpeed = 0.1;
      player.play();
      break;
    case playerState.runLeftBack:
      player.textures = playerRunLeftBack;
      player.loop = true;
      player.animationSpeed = 0.1;
      player.play();
      break;
    }

    player.state = newState;
  }

  return player;
}

stageLevel.addChild(ammoLeftText);
stageLevel.addChild(reloadText);

// start animating
//ScaleToWindow(renderer.view);
animate();
function animate() {
  MoveCreature(player);
  playerBulletPool.updateBulletsSpeed();
  enemyManager.Execute();

  if (player.shooting) {
    if (player.shootingTimeout === gunTimeout) {
      player.shootingTimeout = 0;
      playerBulletPool.shoot(
        renderer.plugins.interaction.mouse.global.x,
        renderer.plugins.interaction.mouse.global.y,
        false
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
  playerRunningLeftBack,
  playerRunningRightBack,
  renderer,
  AnimatePlayer
};
