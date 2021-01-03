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

const GAME_STATES = {
  mainMenu: 0,
  botLevel: 1,
  deathScreen: 2,
  scoreScreen: 3
};

let gameState = GAME_STATES.mainMenu;

const botLevel = new PIXI.Container();
const loadingScreen = new PIXI.Container();
const deathScreen = new PIXI.Container();
const mainMenuScreen = new PIXI.Container();

const loadingStyle = new PIXI.TextStyle({
  fill: 'white',
  fontFamily: 'Impact',
  fontSize: 80,
  stroke: 'white'
});
const loadingText = new PIXI.Text('LOADING...', loadingStyle);
loadingText.x = renderer.width / 4 * 1.5;
loadingText.y = renderer.height / 4 * 1.5;
loadingText.visible = true;
loadingScreen.interactive = false;
loadingScreen.addChild(loadingText);
renderer.render(loadingScreen);

// the sprites array
const textures = [
  './assets/bullet.png',
  './assets/bullet_enemy.png',
  './assets/levels/baseMap.png'];
for (let i = 1, j = 6; i <= 6; i++, j--) {
  textures.push(`./assets/explo_orange/explo_orange_${i}.png`);
  textures.push(`./assets/explo_red/explo_red_${i}.png`);
  textures.push(`./assets/hero/runLeft/hero ${i}.png`);
  textures.push(`./assets/hero/runRight/hero ${i}.png`);
  textures.push(`./assets/enemy/runLeft/enemy_l_${i}.png`);
  textures.push(`./assets/enemy/runRight/enemy_r_${i}.png`);
}
textures.push('./assets/restart_button.png');
textures.push('./assets/exit_button.png');
textures.push('./assets/start_button.png');
textures.push('./assets/score_button.png');

const loader = new PIXI.loaders.Loader();
loader.add(textures);
loader.add('playerShot', './assets/laser_player.mp3');
loader.onComplete.add(setup);
loader.load();

let player,
  dungeon,
  ammoLeftText,
  reloadText,
  waveText,
  waveCountdown,
  playerBulletPool,
  enemyManager,
  playerBulletTexture,
  enemyBulletTexture,
  startButton,
  restartButton,
  exitButton,
  scoreButton;

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

const gunTimeout = 10,
  bulletAmount = 10,
  bulletSpeed = 8,
  reloadSpeed = 80,
  bulletDamage = 20,
  linearSpeed = 4,
  linearEnemySpeed = 2,
  animationState = {
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

    if (this.sourceSprite === player) {
      ammoLeftText.text = this.bulletsLeft + ' / ' + this.amount;
    }

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
      botLevel.addChild(bullet);
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
          explosion.onComplete = () => botLevel.removeChild(explosion);
          botLevel.addChild(explosion);

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
          explosion.onComplete = () => botLevel.removeChild(explosion);

          botLevel.addChild(explosion);
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
    enemyBulletAmount,
    enemyBulletSpeed,
    enemyBulletDamage,
    enemyReloadSpeed,
    enemyLeftRunTexture,
    enemyRightRunTexture,
    enemyLeftBackRunTexture,
    enemyRightBackRunTexture,
    enemyLeftStaleTexture,
    enemyRightStaleTexture
  ) {
    this.enemyLeftRunTexture = enemyLeftRunTexture;
    this.enemyRightRunTexture = enemyRightRunTexture;
    this.enemyLeftBackRunTexture = enemyLeftBackRunTexture;
    this.enemyRightBackRunTexture = enemyRightBackRunTexture;
    this.enemyLeftStaleTexture = enemyLeftStaleTexture;
    this.enemyRightStaleTexture = enemyRightStaleTexture;
    this.enemyBulletAmount = enemyBulletAmount;
    this.enemyBulletSpeed = enemyBulletSpeed;
    this.enemyBulletDamage = enemyBulletDamage;
    this.enemyReloadSpeed = enemyReloadSpeed;

    this.Freezer1 = 80;
    this.Freezer2 = 80;
    this.Freezer3 = 150;
    this.FreezerVelocityChange = 150;

    this.wave = 1;
    this.enemyAmount = 1;
    this.enemyHealth = player.health;

    this.SpawnWave(
      this.wave
    );
  }

  SpawnWave() {
    this.enemies = [];

    player.position.x = renderer.width / 4;
    player.position.y = renderer.height / 2;

    this.enemyAmount *= Math.floor(this.wave > 3 ?
      (this.wave > 10 ?
        1.1 :
        1.25) :
      1.4);
    this.enemyHealth += this.wave * 1.2;
    for (let i = 0; i < this.enemyAmount; i++) this.SpawnEnemy(
      this.enemyHealth,
      this.enemyBulletAmount,
      this.enemyBulletSpeed,
      this.enemyBulletDamage,
      this.enemyReloadSpeed
    );
    this.enemiesLeft = this.enemyAmount;

    this.waveFreezer1Countdown = this.Freezer1;
    this.waveFreezer2Countdown = this.Freezer2;
    this.waveFreezer3Countdown = this.Freezer3;

    this.waveFreezer1Done = false;
    this.waveFreezer2Done = false;
  }

  SpawnEnemy(
    enemyHealth,
    enemyBulletAmount,
    enemyBulletSpeed,
    enemyBulletDamage,
    enemyReloadSpeed
  ) {
    const enemyTemp = new PIXI.extras.AnimatedSprite(
      this.enemyLeftStaleTexture
    );
    enemyTemp.position.x = player.x + 300 + Math.random() *
      (renderer.width - (player.x + 300 - dungeon.x) - 120);
    enemyTemp.position.y = dungeon.y + 90 + Math.random() *
      (renderer.height - 270);
    enemyTemp.scale.x = 1.5;
    enemyTemp.scale.y = 1.5;
    enemyTemp.visible = true;
    enemyTemp.vx = 0;
    enemyTemp.vy = 0;
    enemyTemp.state = animationState.idleLeft;
    botLevel.addChild(enemyTemp);

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
      shootingTimeout: 0,
      moveChangeFreezer: this.FreezerVelocityChange
    };

    this.enemies.push(enemyStruct);
  }

  Execute() {
    if (this.enemiesLeft > 0) {
      for (let i = 0; i < this.enemyAmount; i++) {
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
                botLevel.removeChild(this.enemies[i].enemy);
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

          if (this.enemies[i].moveChangeFreezer > 0) {
            this.enemies[i].moveChangeFreezer--;
          } else {
            this.enemies[i].enemy.vx = (Math.random() * 10 > 5 ? 1 : -1) *
              linearEnemySpeed;
            this.enemies[i].enemy.vy = (Math.random() * 10 > 5 ? 1 : -1) *
              linearEnemySpeed;
            this.enemies[i].moveChangeFreezer = this.FreezerVelocityChange;
          }
          MoveCreature(this.enemies[i].enemy);
          this.Animate(this.enemies[i].enemy);
        }
      }
    } else {
      if (!this.waveFreezer1Done) {
        WaveCleared(this.wave, 1);
        this.Clear();
        this.waveFreezer1Done = true;
      }
      if (this.waveFreezer1Countdown === 0) {
        if (!this.waveFreezer2Done) {
          this.wave += 1;
          WaveCleared(this.wave, 2);
          this.waveFreezer2Done = true;
        }
        if (this.waveFreezer2Countdown === 0) {
          if (this.waveFreezer3Countdown / 50 === 3) {
            WaveCleared(this.wave, 3);
            this.waveFreezer3Countdown--;
          } else if (this.waveFreezer3Countdown / 50 > 2) {
            WaveCleared(this.wave, 7);
            this.waveFreezer3Countdown--;
          } else if (this.waveFreezer3Countdown / 50 === 2) {
            WaveCleared(this.wave, 4);
            this.waveFreezer3Countdown--;
          } else if (this.waveFreezer3Countdown / 50 > 1) {
            WaveCleared(this.wave, 7);
            this.waveFreezer3Countdown--;
          } else if (this.waveFreezer3Countdown / 50 === 1) {
            WaveCleared(this.wave, 5);
            this.waveFreezer3Countdown--;
          } else if (this.waveFreezer3Countdown / 50 > 0) {
            WaveCleared(this.wave, 7);
            this.waveFreezer3Countdown--;
          } else if (this.waveFreezer3Countdown === 0) {
            WaveCleared(this.wave, 6);
            this.SpawnWave();
          } else this.waveFreezer3Countdown--;
        } else this.waveFreezer2Countdown--;
      } else this.waveFreezer1Countdown--;
    }

    // updating the enemies bullets
    for (let i = 0; i < this.enemyAmount; i++) {
      for (
        let j = 0;
        j < this.enemies[i].enemyBulletPool.getBulletsAmount();
        j++
      ) {
        if (
          this.enemies[i].enemyBulletPool.getBullet(j).active &&
          !this.enemies[i].enemyBulletPool.getBullet(j).destroyed &&
          player.isAlive &&
          checkCollision(
            this.enemies[i].enemyBulletPool.getBullet(j),
            player,
            player.width / 4,
            player.height / 2)
        ) {
          this.enemies[i].enemyBulletPool.setBulletDestroyed(j);
          player.health -=
            this.enemies[i].enemyBulletPool.getDamage();

          // check if the player is killed after the shot
          if (player.health <= 0) {
            player.isAlive = false;
          }
        }
      }

      // updating this enemies bullets even if the enemy is dead
      this.enemies[i].enemyBulletPool.updateBulletsSpeed();
    }
  }

  Animate(enemy) {
    const half = (player.x >= enemy.x ? 2 : 1),
      moving = enemy.vx !== 0 || enemy.vy !== 0;
    const newState = (moving ?
      (half === 2 ?
        (enemy.vx >= 0 ?
          animationState.runRight :
          animationState.runRightBack) :
        (enemy.vx < 0 ?
          animationState.runLeft :
          animationState.runLeftBack)
      ) :
      (half === 2 ? animationState.idleRight : animationState.idleLeft));

    if (enemy.state !== newState) {
      switch (newState) {
      case animationState.idleRight:
        enemy.textures = this.enemyRightStaleTexture;
        enemy.loop = true;
        enemy.play();
        break;
      case animationState.idleLeft:
        enemy.textures = this.enemyLeftStaleTexture;
        enemy.loop = true;
        enemy.play();
        break;
      case animationState.runRight:
        enemy.textures = this.enemyRightRunTexture;
        enemy.loop = true;
        enemy.animationSpeed = 0.1;
        enemy.play();
        break;
      case animationState.runLeft:
        enemy.textures = this.enemyLeftRunTexture;
        enemy.loop = true;
        enemy.animationSpeed = 0.1;
        enemy.play();
        break;
      case animationState.runRightBack:
        enemy.textures = this.enemyRightBackRunTexture;
        enemy.loop = true;
        enemy.animationSpeed = 0.1;
        enemy.play();
        break;
      case animationState.runLeftBack:
        enemy.textures = this.enemyLeftBackRunTexture;
        enemy.loop = true;
        enemy.animationSpeed = 0.1;
        enemy.play();
        break;
      }

      enemy.state = newState;
    }
  }

  Clear() {
    for (let i = 0; i < this.enemyAmount; i++) {
      for (let j = 0;
        j < this.enemies[i].enemyBulletPool.getBulletsAmount();
        j++) {
        if (this.enemies[i].enemyBulletPool.getBullet(j).visible) {
          this.enemies[i].enemyBulletPool.getBullet(j).destroyed = false;
          this.enemies[i].enemyBulletPool.getBullet(j).visible = false;
          this.enemies[i].enemyBulletPool.getBullet(j).active = false;

          const explosion =
            new PIXI.extras.AnimatedSprite(
              this.enemies[i].enemyBulletPool.explosionTexture
            );
          explosion.x = this.enemies[i].enemyBulletPool.getBullet(j).x;
          explosion.y = this.enemies[i].enemyBulletPool.getBullet(j).y;
          explosion.anchor.set(0.5);
          explosion.rotation = Math.random() * Math.PI;
          explosion.scale.set(0.2 + Math.random() * 0.2);
          explosion.loop = false;
          explosion.animationSpeed = 0.5;
          explosion.play();
          explosion.onComplete = () => botLevel.removeChild(explosion);

          botLevel.addChild(explosion);
        }

        botLevel.removeChild(this.enemies[i].enemyBulletPool.getBullet(j));
      }
    }
  }
}

function setup() {
  const buttonX = renderer.width / 4 * 1.4,
    buttonY = renderer.height / 4,
    offsetY = renderer.height / 3;

  restartButton = new PIXI.Sprite(
    PIXI.utils.TextureCache['./assets/restart_button.png']);
  restartButton.x = buttonX;
  restartButton.y = buttonY;
  restartButton.buttonMode = true;
  restartButton.interactive = true;
  restartButton.visible = true;
  restartButton.on('pointerdown', () => {
    gameState = GAME_STATES.botLevel;

    ResetLevel();
  });

  exitButton = new PIXI.Sprite(
    PIXI.utils.TextureCache['./assets/exit_button.png']);
  exitButton.x = buttonX;
  exitButton.y = buttonY + offsetY;
  exitButton.buttonMode = true;
  exitButton.interactive = true;
  exitButton.visible = true;
  exitButton.on('pointerdown', () => {
    gameState = GAME_STATES.mainMenu;

    ResetLevel();
  });

  startButton = new PIXI.Sprite(
    PIXI.utils.TextureCache['./assets/start_button.png']);
  startButton.x = buttonX;
  startButton.y = buttonY;
  startButton.buttonMode = true;
  startButton.interactive = true;
  startButton.visible = true;
  startButton.on('pointerdown', () => {
    gameState = GAME_STATES.botLevel;
  });

  scoreButton = new PIXI.Sprite(
    PIXI.utils.TextureCache['./assets/score_button.png']);
  scoreButton.x = buttonX;
  scoreButton.y = buttonY + offsetY;
  scoreButton.buttonMode = true;
  scoreButton.interactive = true;
  scoreButton.visible = true;
  scoreButton.on('pointerdown', () => {
    gameState = GAME_STATES.scoreScreen;
  });

  // adding the buttons to the death screen
  deathScreen.addChild(restartButton);
  deathScreen.addChild(exitButton);

  // adding the buttons to the main menu screen
  mainMenuScreen.addChild(startButton);
  mainMenuScreen.addChild(scoreButton);

  // dungeon sprite setup
  dungeon = new PIXI.Sprite(
    PIXI.utils.TextureCache['./assets/levels/baseMap.png']);
  dungeon.position.x = 0;
  dungeon.position.y = 0;

  let multiplier = 1.0, previousMultiplier = 1.0;
  while (dungeon.width * multiplier <= renderer.width) {
    previousMultiplier = multiplier;
    multiplier += 0.01;
  }
  dungeon.scale.x = previousMultiplier;
  dungeon.scale.y = previousMultiplier;
  botLevel.addChild(dungeon);

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

  playerBulletTexture = new PIXI.Texture(
    PIXI.utils.TextureCache['./assets/bullet.png']);
  enemyBulletTexture = new PIXI.Texture(
    PIXI.utils.TextureCache['./assets/bullet_enemy.png']);

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
  player.state = animationState.idleRight;
  botLevel.addChild(player);

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
    6,
    20,
    80,
    enemyRunLeft,
    enemyRunRight,
    enemyRunLeftBack,
    enemyRunRightBack,
    enemyStaleLeft,
    enemyStaleRight);

  // creating a custom cursor-crosshair
  const interaction = renderer.plugins.interaction;
  interaction.cursorStyles['crosshair'] =
    'url(\'./assets/utils/crosshair.cur\'),auto';
  botLevel.interactive = true;
  botLevel.cursor = 'crosshair';

  botLevel.on('pointerdown', () => {
    player.shooting = true;
  });
  botLevel.on('pointerup', () => {
    player.shooting = false;
    player.shootingTimeout = gunTimeout;
  });


  // adding texts on the stage
  botLevel.addChild(ammoLeftText);
  botLevel.addChild(reloadText);

  ScaleToWindow(renderer.view);

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

  animate();
}

function ResetLevel() {
  botLevel.removeChildren();

  botLevel.addChild(dungeon);

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
  player.state = animationState.idleRight;
  botLevel.addChild(player);

  playerBulletPool = new BulletPool(
    playerBulletTexture,
    explosionOrangeTextures,
    bulletAmount,
    bulletSpeed,
    bulletDamage,
    reloadSpeed,
    player
  );

  ammoLeftText.text = '12 / 12';
  reloadText.visible = false;
  botLevel.addChild(ammoLeftText);
  botLevel.addChild(reloadText);

  enemyManager = new EnemyManager(
    5,
    6,
    20,
    80,
    enemyRunLeft,
    enemyRunRight,
    enemyRunLeftBack,
    enemyRunRightBack,
    enemyStaleLeft,
    enemyStaleRight);
}

function WaveCleared(wave, step) {
  const waveTextStyle = new PIXI.TextStyle({
    fill: 'white',
    fontFamily: 'Impact',
    fontSize: 100,
    stroke: 'white'
  });
  const waveCountdownStyle = new PIXI.TextStyle({
    fill: 'white',
    fontFamily: 'Impact',
    fontSize: 200,
    stroke: 'white'
  });
  switch (step) {
  case 1: {
    waveText = new PIXI.Text('WAVE ' + wave + ' CLEARED', waveTextStyle);
    waveText.anchor.set(0.5);
    waveText.x = renderer.width / 2;
    waveText.y = renderer.height / 2.5;
    waveText.visible = true;

    botLevel.addChild(waveText);
    break;
  }
  case 2: {
    waveText.text = 'WAVE ' + wave + ' STARTING...';
    break;
  }
  case 3: {
    waveText.visible = false;
    botLevel.removeChild(waveText);

    waveCountdown = new PIXI.Text('3', waveCountdownStyle);
    waveCountdown.anchor.set(0.5);
    waveCountdown.scale.x = 1;
    waveCountdown.scale.y = 1;
    waveCountdown.x = renderer.width / 2;
    waveCountdown.y = renderer.height / 2;
    waveCountdown.visible = true;
    botLevel.addChild(waveCountdown);
    break;
  }
  case 4: {
    waveCountdown.scale.x = 1;
    waveCountdown.scale.y = 1;
    waveCountdown.text = '2';
    break;
  }
  case 5: {
    waveCountdown.scale.x = 1;
    waveCountdown.scale.y = 1;
    waveCountdown.text = '1';
    break;
  }
  case 6: {
    waveCountdown.visible = false;
    botLevel.removeChild(waveCountdown);
    break;
  }
  case 7: {
    waveCountdown.scale.x -= 0.017;
    waveCountdown.scale.y -= 0.017;
  }
  }
}

function MoveCreature(creature) {
  const creatureCollisions = contain(creature, dungeon);

  if (creatureCollisions.x === collisionType.no ||
    ((creatureCollisions.x === collisionType.left) && (creature.vx >= 0)) ||
    ((creatureCollisions.x === collisionType.right) && (creature.vx <= 0))
  ) {
    if (creature !== player) {
      console.log('moving enemy x');
    }
    creature.position.x += creature.vx;
  }
  if (creatureCollisions.y === collisionType.no ||
    ((creatureCollisions.y === collisionType.top) && (creature.vy <= 0)) ||
    ((creatureCollisions.y === collisionType.down) && (creature.vy >= 0))
  ) {
    if (creature !== player) {
      console.log('moving enemy y');
    }
    creature.position.y -= creature.vy;
  }
}

function AnimatePlayer(mouseX) {
  const half = (mouseX >= player.x ? 2 : 1),
    moving = player.vx !== 0 || player.vy !== 0;
  const newState = (moving ?
    (half === 2 ?
      (player.vx >= 0 ?
        animationState.runRight :
        animationState.runRightBack) :
      (player.vx < 0 ?
        animationState.runLeft :
        animationState.runLeftBack)
    ) :
    (half === 2 ? animationState.idleRight : animationState.idleLeft));

  if (player.state !== newState) {
    switch (newState) {
    case animationState.idleRight:
      player.textures = playerStaleRight;
      player.loop = true;
      player.play();
      break;
    case animationState.idleLeft:
      player.textures = playerStaleLeft;
      player.loop = true;
      player.play();
      break;
    case animationState.runRight:
      player.textures = playerRunRight;
      player.loop = true;
      player.animationSpeed = 0.1;
      player.play();
      break;
    case animationState.runLeft:
      player.textures = playerRunLeft;
      player.loop = true;
      player.animationSpeed = 0.1;
      player.play();
      break;
    case animationState.runRightBack:
      player.textures = playerRunRightBack;
      player.loop = true;
      player.animationSpeed = 0.1;
      player.play();
      break;
    case animationState.runLeftBack:
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
  if (gameState === GAME_STATES.botLevel && player.isAlive) {
    playerBulletPool.updateBulletsSpeed();
    enemyManager.Execute();

    MoveCreature(player);

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
    renderer.render(botLevel);
  } else if (gameState === GAME_STATES.botLevel && !player.isAlive) {
    gameState = GAME_STATES.deathScreen;
    renderer.render(deathScreen);
  } else if (gameState === GAME_STATES.deathScreen) {
    renderer.render(deathScreen);
  } else if (gameState === GAME_STATES.mainMenu) {
    renderer.render(mainMenuScreen);
  }

  requestAnimationFrame(animate);
}

export const result = {
  stageLevel: botLevel,
  player,
  playerBulletPool,
  dungeon,
  renderer,
  AnimatePlayer
};
