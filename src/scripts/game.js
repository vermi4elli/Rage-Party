import * as PIXI from 'pixi.js';
import { ScaleToWindow } from './scaleWindow';
import { keyboard } from './keyboard';
import { checkCollision, collisionType, contain } from './contain';
import sound from 'pixi-sound';

const renderer =
  PIXI.autoDetectRenderer({
    width: window.innerWidth,
    height: window.innerHeight,
    backgroundColor: 0x1a1f1b,
    autoDensity: true
  });
document.body.appendChild(renderer.view);

window.addEventListener('resize', () => {
  ScaleToWindow(renderer.view);
});

// the sprites array
const textures = [
  'assets/bullet.png',
  'assets/bullet_enemy.png',
  'assets/levels/baseMap.png'];
for (let i = 1, j = 6; i <= 6; i++, j--) {
  textures.push(`./assets/explo_orange/explo_orange_${i}.png`);
  textures.push(`./assets/explo_red/explo_red_${i}.png`);
  textures.push(`./assets/hero/runLeft/hero ${i}.png`);
  textures.push(`./assets/hero/runRight/hero ${i}.png`);
  textures.push(`./assets/enemy/runLeft/enemy_l_${i}.png`);
  textures.push(`./assets/enemy/runRight/enemy_r_${i}.png`);
}

const loader = new PIXI.loaders.Loader();
loader.add(textures);
loader.add('playerShot', './assets/laser_player.mp3');
loader.onComplete.add(setup);
loader.load();

let player,
  dungeon,
  ammoLeftText,
  reloadText,
  playerBulletPool,
  enemyManager,
  playerBulletTexture,
  enemyBulletTexture;
const explosionOrangeTextures = [],
  explosionRedTextures = [],
  playerRunLeft = [],
  playerRunRight = [],
  playerRunLeftBack = [],
  playerRunRightBack = [],
  playerStaleLeft = [],
  playerStaleRight = [],
  enemyRunLeft = [],
  enemyRunRight = [],
  enemyRunLeftBack = [],
  enemyRunRightBack = [],
  enemyStaleLeft = [],
  enemyStaleRight = [];

const stageLevel = new PIXI.Container();

const gunTimeout = 10,
  bulletAmount = 10,
  bulletSpeed = 8,
  reloadSpeed = 80,
  bulletDamage = 20,
  linearSpeed = 4,
  playerState = {
    idleRight: 0,
    idleLeft: 1,
    runRight: 2,
    runLeft: 3,
    runRightBack: 4,
    runLeftBack: 5
  },
  left = keyboard('KeyA'),
  up = keyboard('KeyW'),
  right = keyboard('KeyD'),
  down = keyboard('KeyS'),
  reloadButton = keyboard('KeyR');

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

      if (this.sourceSprite === player) {
        sound.play('playerShot', {
          loop: false,
          speed: 3,
          volume: 0.3
        });
      }
    } else if (autoReload &&
      this.bulletsLeft === 0 &&
      !this.isReloading) {
      if (this.sourceSprite === player) {
        sound.stop('playerShot');
      }
      this.reload();
    } else if (!this.isReloading &&
      this.bulletsLeft === 0 &&
      this.sourceSprite === player
    ) {
      if (this.sourceSprite === player) {
        sound.stop('playerShot');
      }
      reloadText.text = 'PRESS \'R\' TO RELOAD';
      reloadText.visible = true;
    }
  }

  reload() {
    this.isReloading = true;
    this.reloadCooldown = this.reloadSpeed;
  }
}

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

function setup() {
  // dungeon sprite setup
  dungeon = new PIXI.Sprite(
    PIXI.utils.TextureCache['assets/levels/baseMap.png']);
  dungeon.position.x = 0;
  dungeon.position.y = 0;

  let multiplier = 1.0, previousMultiplier = 1.0;
  while (dungeon.width * multiplier <= renderer.width) {
    console.log('multiplier: ' + multiplier +
      '; prevMultiplier: ' +
      previousMultiplier);
    previousMultiplier = multiplier;
    multiplier += 0.01;
  }
  dungeon.scale.x = previousMultiplier;
  dungeon.scale.y = previousMultiplier;
  stageLevel.addChild(dungeon);
  console.log('made dungeon');

  // ammo text setup
  const ammoLeftStyle = new PIXI.TextStyle({
    fill: 'white',
    fontFamily: 'Impact',
    fontSize: 40,
    stroke: 'white'
  });
  ammoLeftText = new PIXI.Text('12 / 12', ammoLeftStyle);
  ammoLeftText.x = renderer.width / 10 * 9;
  ammoLeftText.y = renderer.height / 7 * 6;

  // reload hint text setup
  const reloadStyle = new PIXI.TextStyle({
    fill: 'red',
    fontFamily: 'Impact',
    fontSize: 40,
    stroke: 'white'
  });
  reloadText = new PIXI.Text('PRESS \'R\' TO RELOAD', reloadStyle);
  reloadText.x = renderer.width / 10 * 5;
  reloadText.y = renderer.height / 7 * 6;
  reloadText.visible = false;
  console.log('made texts');

  playerBulletTexture = new PIXI.Texture(
    PIXI.utils.TextureCache['assets/bullet.png']);
  enemyBulletTexture = new PIXI.Texture(
    PIXI.utils.TextureCache['assets/bullet_enemy.png']);

  playerStaleLeft.push(PIXI.utils.TextureCache[
    './assets/hero/runLeft/hero 6.png']);
  playerStaleRight.push(PIXI.utils.TextureCache[
    './assets/hero/runRight/hero 6.png']);
  enemyStaleLeft.push(PIXI.utils.TextureCache[
    './assets/enemy/runLeft/enemy_l_6.png']);
  enemyStaleRight.push(PIXI.utils.TextureCache[
    './assets/enemy/runRight/enemy_r_6.png']);

  for (let i = 1, j = 6; i <= 6; i++, j--) {
    explosionOrangeTextures.push(
      PIXI.utils.TextureCache[`./assets/explo_orange/explo_orange_${i}.png`]
    );
    explosionRedTextures.push(
      PIXI.utils.TextureCache[`./assets/explo_red/explo_red_${i}.png`]
    );
    playerRunLeft.push(
      PIXI.utils.TextureCache[`./assets/hero/runLeft/hero ${i}.png`]
    );
    playerRunRight.push(
      PIXI.utils.TextureCache[`./assets/hero/runRight/hero ${i}.png`]
    );
    playerRunLeftBack.push(
      PIXI.utils.TextureCache[`./assets/hero/runLeft/hero ${j}.png`]
    );
    playerRunRightBack.push(
      PIXI.utils.TextureCache[`./assets/hero/runRight/hero ${j}.png`]
    );
    enemyRunLeft.push(
      PIXI.utils.TextureCache[`./assets/enemy/runLeft/enemy_l_${i}.png`]
    );
    enemyRunRight.push(
      PIXI.utils.TextureCache[`./assets/enemy/runRight/enemy_r_${i}.png`]
    );
    enemyRunLeftBack.push(
      PIXI.utils.TextureCache[`./assets/enemy/runLeft/enemy_l_${j}.png`]
    );
    enemyRunRightBack.push(
      PIXI.utils.TextureCache[`./assets/enemy/runRight/enemy_r_${j}.png`]
    );
  }
  console.log('made all textures');

  // the player sprite
  player = new PIXI.extras.AnimatedSprite(playerStaleRight);
  player.position.x = renderer.width / 4;
  player.position.y = renderer.height / 2;
  player.vx = 0;
  player.vy = 0;
  player.scale.x = 1.5;
  player.scale.y = 1.5;
  player.shooting = false;
  player.shootingTimeout = gunTimeout;
  player.health = 100;
  player.isAlive = true;
  player.state = playerState.idleRight;
  stageLevel.addChild(player);

  playerBulletPool = new BulletPool(
    playerBulletTexture,
    explosionOrangeTextures,
    bulletAmount,
    bulletSpeed,
    bulletDamage,
    reloadSpeed,
    player
  );

  enemyManager = new EnemyManager(
    5,
    100,
    5,
    6,
    20,
    80);

  // creating a custom cursor-crosshair
  const interaction = renderer.plugins.interaction;
  interaction.cursorStyles['crosshair'] =
    'url(\'./assets/utils/crosshair.cur\'),auto';
  stageLevel.interactive = true;
  stageLevel.cursor = 'crosshair';

  stageLevel.on('mousedown', () => {
    player.shooting = true;
  });
  stageLevel.on('mouseup', () => {
    player.shooting = false;
    player.shootingTimeout = gunTimeout;
  });

  // player control
  left.press = () => player.vx -= linearSpeed;
  left.release = () => player.vx += linearSpeed;
  up.press = () => player.vy += linearSpeed;
  up.release = () => player.vy -= linearSpeed;
  right.press = () => player.vx += linearSpeed;
  right.release = () => player.vx -= linearSpeed;
  down.press = () => player.vy -= linearSpeed;
  down.release = () => player.vy += linearSpeed;
  reloadButton.press = () => playerBulletPool.reload();

  // adding texts on the stage
  stageLevel.addChild(ammoLeftText);
  stageLevel.addChild(reloadText);

  ScaleToWindow(renderer.view);
  animate();
}

const playerRunningLeft = new PIXI.extras.AnimatedSprite(playerRunLeft),
  playerRunningRight = new PIXI.extras.AnimatedSprite(playerRunRight),
  playerRunningLeftBack = new PIXI.extras.AnimatedSprite(playerRunLeftBack),
  playerRunningRightBack = new PIXI.extras.AnimatedSprite(playerRunRightBack);
playerRunningLeft.loop = true;
playerRunningRight.loop = true;

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
