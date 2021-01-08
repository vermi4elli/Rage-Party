import * as PIXI from 'pixi.js';
import { ScaleToWindow } from './scaleWindow';
import { keyboard } from './keyboard';
import { checkCollision, collisionType, contain } from './contain';
import sound from 'pixi-sound';
const PixiTextInput = require('./PixiTextInput');

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
  waiting: 0,
  mainMenu: 1,
  botLevel: 2,
  deathScreen: 3,
  scoreScreen: 4,
  tutorialScreen: 5
};

let gameState = GAME_STATES.waiting;

const botLevel = new PIXI.Container();
const loadingScreen = new PIXI.Container();
const deathScreen = new PIXI.Container();
const mainMenuScreen = new PIXI.Container();
const waitingScreen = new PIXI.Container();
const scoreScreen = new PIXI.Container();
const tutorialScreen = new PIXI.Container();

// Text styles
const loadingStyle = new PIXI.TextStyle({
  fill: 'white',
  fontFamily: 'Impact',
  fontSize: 80,
  stroke: 'white'
});
const ammoLeftStyle = new PIXI.TextStyle({
  fill: 'white',
  fontFamily: 'Impact',
  fontSize: 40,
  stroke: 'white'
});
const deathStyle = new PIXI.TextStyle({
  fill: 'red',
  fontFamily: 'Impact',
  fontSize: 100,
  stroke: 'white'
});
const reloadStyle = new PIXI.TextStyle({
  fill: 'red',
  fontFamily: 'Impact',
  fontSize: 40,
  stroke: 'white'
});
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
const scoreLineStyle = new PIXI.TextStyle({
  fill: 'white',
  fontFamily: 'Impact',
  fontSize: 50,
  stroke: 'white'
});
const scoreTitleStyle = new PIXI.TextStyle({
  fill: 'red',
  fontFamily: 'Impact',
  fontSize: 50,
  stroke: 'white'
});

const loadingText = new PIXI.Text('LOADING...', loadingStyle);
loadingText.position.set(renderer.width / 4 * 1.5, renderer.height / 4 * 1.5);
loadingText.visible = true;
loadingScreen.interactive = false;
loadingScreen.addChild(loadingText);
renderer.render(loadingScreen);

// the sprites array
const textures = [
  './assets/bullets/player_bullet.png',
  './assets/bullets/enemy_bullet.png',
  './assets/levels/baseMap.png'];
for (let i = 1, j = 6; i <= 6; i++, j--) {
  textures.push(`./assets/explo_orange/explo_orange_${i}.png`);
  textures.push(`./assets/explo_red/explo_red_${i}.png`);
  textures.push(`./assets/hero/runLeft/hero ${i}.png`);
  textures.push(`./assets/hero/runRight/hero ${i}.png`);
  textures.push(`./assets/enemy/runLeft/enemy_l_${i}.png`);
  textures.push(`./assets/enemy/runRight/enemy_r_${i}.png`);
}
textures.push('./assets/buttons/restart_button.png');
textures.push('./assets/buttons/exit_button.png');
textures.push('./assets/buttons/start_button.png');
textures.push('./assets/buttons/score_button.png');
textures.push('./assets/buttons/back_button.png');

const loader = new PIXI.loaders.Loader();
loader.add(textures);
loader.add('playerShot', './assets/sounds/laser_player.mp3');
loader.add('playerReload', './assets/sounds/reload_player.mp3');
loader.add('enemyShot', './assets/sounds/laser_enemy.mp3');
loader.add('mainMenu', './assets/music/mainMenuMusic.mp3');
loader.add('battleMusic', './assets/music/battleMusic.mp3');
loader.onComplete.add(setup);
loader.load();

let player,
  healthBar,
  dungeon,
  ammoLeftText,
  reloadText,
  waveText,
  deathText,
  titleText,
  waitingText,
  waveCountdown,
  playerBulletPool,
  enemyManager,
  playerBulletTexture,
  enemyBulletTexture,
  startButton,
  restartButton,
  exitButton,
  scoreButton,
  backButton,
  scoreData,
  tempScore = 0,
  nameInput,
  tutorialText,
  tutorialInlineText,
  fetchedData = false,
  ableToPost = false,
  PostedData = false,
  setDeathScreen = false;

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
  enemyStaleRight = [],
  left = keyboard('KeyA'),
  up = keyboard('KeyW'),
  right = keyboard('KeyD'),
  down = keyboard('KeyS'),
  reloadButton = keyboard('KeyR');

const gunTimeout = 10,
  bulletAmount = 10,
  bulletSpeed = 8,
  reloadSpeed = 80,
  bulletDamage = 20,
  linearSpeed = 4,
  linearEnemySpeed = 2,
  rotPos = 0.005,
  rotNeg = -0.005,
  animationState = {
    idleRight: 0,
    idleLeft: 1,
    runRight: 2,
    runLeft: 3,
    runRightBack: 4,
    runLeftBack: 5
  };

let rotation = rotPos;

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
      bullet.position.set(0, 0);
      bullet.visible = false;
      bullet.scale.set(1.5);
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

          explosion.position.set(this.bulletPool[b].x, this.bulletPool[b].y);
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
          explosion.position.set(this.bulletPool[b].x, this.bulletPool[b].y);
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
      if (this.sourceSprite === player) {
        reloadText.text = 'RELOADING...';
      }
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

      bullet.position.set(
        this.sourceSprite.x + this.sourceSprite.width / 5,
        this.sourceSprite.y + this.sourceSprite.height / 3
      );

      bullet.active = true;

      if (this.sourceSprite === player) {
        sound.play('playerShot', {
          loop: false,
          speed: 3,
          volume: 0.3
        });
      } else {
        sound.play('enemyShot', {
          loop: false,
          speed: 3,
          volume: 0.15
        });
      }
    } else if (autoReload &&
      this.bulletsLeft === 0 &&
      !this.isReloading) {
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
    if (this.sourceSprite !== player ||
      (!this.isReloading &&
      this.getBulletsLeft() !== this.getBulletsAmount())
    ) {
      this.isReloading = true;
      this.reloadCooldown = this.reloadSpeed;
      if (this.sourceSprite === player) {
        reloadText.visible = true;
        sound.play('playerReload', {
          loop: false,
          speed: 1,
          volume: 0.6
        });
      }
    }
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

    this.wave = 0;
    this.enemyAmountKoef = 1;
    this.enemyAmount = this.enemyAmountKoef;
    this.enemyHealth = player.initialHealth;
    this.enemiesLeft = 0;

    this.waveFreezer1Countdown = this.Freezer1;
    this.waveFreezer2Countdown = this.Freezer2;
    this.waveFreezer3Countdown = this.Freezer3;

    this.waveFreezer1Done = false;
    this.waveFreezer2Done = false;

    this.firstWave = true;
  }

  SpawnWave() {
    this.firstWave = false;

    this.enemies = [];

    player.position.set(renderer.width / 4, renderer.height / 2);

    this.enemyAmountKoef *= this.wave > 3 ?
      (this.wave > 10 ?
        1.1 :
        1.25) :
      1.4;
    this.enemyAmount = Math.floor(this.enemyAmountKoef);
    this.enemyHealth += this.wave * 1.2;
    for (let i = 0; i < this.enemyAmount; i++) this.SpawnEnemy(
      this.enemyHealth,
      this.enemyBulletAmount,
      this.enemyBulletSpeed,
      this.enemyBulletDamage,
      this.enemyReloadSpeed + Math.floor(Math.random() * 20),
      gunTimeout + Math.floor(Math.random() * 20)
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
    enemyReloadSpeed,
    enemyGunTimeout
  ) {
    const enemyTemp = new PIXI.extras.AnimatedSprite(
      this.enemyLeftStaleTexture
    );
    enemyTemp.position.set(
      player.x + 300 + Math.random() *
      (renderer.width - (player.x + 300 - dungeon.x) - 120), // available width
      dungeon.y + 90 + Math.random() *
      (renderer.height - 270) // available height
    );
    enemyTemp.scale.set(1.5);
    enemyTemp.visible = true;
    enemyTemp.vx = 0;
    enemyTemp.vy = 0;
    enemyTemp.state = animationState.idleLeft;
    enemyTemp.gunTimeout = enemyGunTimeout;
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
      shootingTimeout: Math.floor(Math.random() * 10),
      moveChangeFreezer: this.FreezerVelocityChange / 4
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
                tempScore += 100;
              }
            }
          }

          // try to fire bullets
          if (this.enemies[i].active && player.isAlive) {
            if (this.enemies[i].shootingTimeout ===
              this.enemies[i].enemy.gunTimeout) {
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
        WaveCleared(this.wave, 1, this.firstWave);
        if (this.wave) this.Clear();
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
    if (!this.firstWave) {
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
            } else {
              healthBar.updateHealth(player.health, player.initialHealth);
            }
          }
        }

        // updating this enemies bullets even if the enemy is dead
        this.enemies[i].enemyBulletPool.updateBulletsSpeed();
      }
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
          explosion.position.set(
            this.enemies[i].enemyBulletPool.getBullet(j).x,
            this.enemies[i].enemyBulletPool.getBullet(j).y
          );
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
  const buttonX = renderer.width / 2,
    textY = renderer.height / 6,
    offsetY = renderer.height / 4,
    buttonY = renderer.height / 2;

  restartButton = new PIXI.Sprite(
    PIXI.utils.TextureCache['./assets/buttons/restart_button.png']);
  restartButton.anchor.set(0.5);
  restartButton.position.set(buttonX, buttonY);
  restartButton.buttonMode = true;
  restartButton.interactive = true;
  restartButton.visible = true;
  restartButton.on('pointerdown', () => {
    gameState = GAME_STATES.botLevel;

    ResetLevel();
  });

  exitButton = new PIXI.Sprite(
    PIXI.utils.TextureCache['./assets/buttons/exit_button.png']);
  exitButton.anchor.set(0.5);
  exitButton.position.set(buttonX, buttonY + offsetY);
  exitButton.buttonMode = true;
  exitButton.interactive = true;
  exitButton.visible = true;
  exitButton.on('pointerdown', () => {
    gameState = GAME_STATES.mainMenu;

    ableToPost = true;

    sound.stop('battleMusic');

    if (!sound.find('mainMenu').isPlaying) {
      sound.play('mainMenu', {
        loop: true,
        speed: 1,
        volume: 0.3
      });
    }

    ResetLevel();
  });

  startButton = new PIXI.Sprite(
    PIXI.utils.TextureCache['./assets/buttons/start_button.png']);
  startButton.anchor.set(0.5);
  startButton.position.set(buttonX, buttonY);
  startButton.buttonMode = true;
  startButton.interactive = true;
  startButton.visible = true;
  startButton.on('pointerdown', () => {
    gameState = GAME_STATES.tutorialScreen;

    sound.stop('mainMenu');

    sound.play('battleMusic', {
      loop: true,
      speed: 1,
      volume: 0.3
    });
  });

  scoreButton = new PIXI.Sprite(
    PIXI.utils.TextureCache['./assets/buttons/score_button.png']);
  scoreButton.anchor.set(0.5);
  scoreButton.position.set(buttonX, buttonY + offsetY);
  scoreButton.buttonMode = true;
  scoreButton.interactive = true;
  scoreButton.visible = true;
  scoreButton.on('pointerdown', () => {
    gameState = GAME_STATES.scoreScreen;
  });

  backButton = new PIXI.Sprite(
    PIXI.utils.TextureCache['./assets/buttons/back_button.png']);
  backButton.anchor.set(0.5);
  backButton.buttonMode = true;
  backButton.interactive = true;
  backButton.visible = true;
  backButton.on('pointerdown', () => {
    fetchedData = false;
    gameState = GAME_STATES.mainMenu;
  });

  // adding the buttons to the death screen
  deathText = new PIXI.Text('', deathStyle);
  deathText.anchor.set(0.5);
  deathText.position.set(buttonX, textY);
  deathText.visible = true;

  deathScreen.addChild(restartButton);
  deathScreen.addChild(exitButton);
  deathScreen.addChild(deathText);

  // adding the buttons to the main menu screen
  titleText = new PIXI.Text('Rage 🤬 Party', deathStyle);
  titleText.anchor.set(0.5);
  titleText.position.set(buttonX, textY);
  titleText.visible = true;
  mainMenuScreen.addChild(startButton);
  mainMenuScreen.addChild(scoreButton);
  mainMenuScreen.addChild(titleText);

  waitingText = new PIXI.Text('Press here to continue...', deathStyle);
  waitingText.anchor.set(0.5);
  waitingText.position.set(renderer.width / 2, renderer.height / 2);
  waitingText.visible = true;
  waitingText.buttonMode = true;
  waitingText.interactive = true;
  waitingText.on('pointerdown', () => {
    gameState = GAME_STATES.mainMenu;
  });
  waitingScreen.interactive = true;
  waitingScreen.addChild(waitingText);

  // dungeon sprite setup
  dungeon = new PIXI.Sprite(
    PIXI.utils.TextureCache['./assets/levels/baseMap.png']);
  dungeon.position.set(0, 0);

  let multiplier = 1.0, previousMultiplier = 1.0;
  while (dungeon.width * multiplier <= renderer.width) {
    previousMultiplier = multiplier;
    multiplier += 0.01;
  }
  dungeon.scale.set(previousMultiplier);
  botLevel.addChild(dungeon);

  playerBulletTexture = new PIXI.Texture(
    PIXI.utils.TextureCache['./assets/bullets/player_bullet.png']);
  enemyBulletTexture = new PIXI.Texture(
    PIXI.utils.TextureCache['./assets/bullets/enemy_bullet.png']);

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

  tutorialInlineText = new PIXI.Text('HOW TO PLAY',
    scoreTitleStyle);
  tutorialInlineText.anchor.set(0.5);
  tutorialInlineText.position.set(renderer.width / 2, renderer.height / 8);
  tutorialInlineText.visible = true;
  tutorialScreen.addChild(tutorialInlineText);

  tutorialInlineText = new PIXI.Text(
    'To shoot: hover the mouse over the enemy and press LMB.\n' +
    'To move: use keys WASD. To reload: use key R.\n' +
    'The bar in the left lower bottom corner \n' +
    'represents your health level.\n' +
    'The numbers in the right lower bottom corner \n' +
    'represents your ammo left.\n',
    scoreLineStyle);
  tutorialInlineText.anchor.set(0.5);
  tutorialInlineText.position.set(
    renderer.width / 2,
    renderer.height / 5 * 2.5
  );
  tutorialInlineText.visible = true;
  tutorialScreen.addChild(tutorialInlineText);

  tutorialText = new PIXI.Text('Press here to continue...', scoreTitleStyle);
  tutorialText.anchor.set(0.5);
  tutorialText.position.set(renderer.width / 2, renderer.height / 5 * 4);
  tutorialText.visible = true;
  tutorialText.buttonMode = true;
  tutorialText.interactive = true;
  tutorialText.on('pointerdown', () => {
    gameState = GAME_STATES.botLevel;
  });
  tutorialScreen.interactive = true;
  tutorialScreen.addChild(tutorialText);

  // the player sprite
  player = new PIXI.extras.AnimatedSprite(playerStaleRight);
  player.position.set(renderer.width / 4, renderer.height / 2);
  player.vx = 0;
  player.vy = 0;
  player.scale.set(1.5);
  player.shooting = false;
  player.shootingTimeout = gunTimeout;
  player.initialHealth = 100;
  player.health = player.initialHealth;
  player.isAlive = true;
  player.state = animationState.idleRight;
  botLevel.addChild(player);

  // ammo text setup
  ammoLeftText = new PIXI.Text('', ammoLeftStyle);
  ammoLeftText.position.set(
    dungeon.x + dungeon.width / 10 * 8.6,
    dungeon.y + dungeon.height / 7 * 6
  );

  playerBulletPool = new BulletPool(
    playerBulletTexture,
    explosionOrangeTextures,
    bulletAmount,
    bulletSpeed,
    bulletDamage,
    reloadSpeed,
    player
  );

  // reload hint text setup
  reloadText = new PIXI.Text('PRESS \'R\' TO RELOAD', reloadStyle);
  reloadText.position.set(
    dungeon.x + dungeon.width / 10 * 6,
    dungeon.y + dungeon.height / 7 * 6
  );
  reloadText.visible = false;

  healthBar = new PIXI.Container();
  healthBar.position.set(
    dungeon.x + dungeon.width / 10,
    dungeon.y + dungeon.height / 7 * 6.1
  );
  botLevel.addChild(healthBar);

  //Create the black background rectangle
  const innerBar = new PIXI.Graphics();
  innerBar.beginFill(0x000000);
  innerBar.drawRect(-5, -5, dungeon.width / 8 + 10, dungeon.height / 20 + 10);
  innerBar.endFill();
  healthBar.addChild(innerBar);

  //Create the front red rectangle
  const outerBar = new PIXI.Graphics();
  outerBar.beginFill(0xFF3300);
  outerBar.drawRect(0, 0, dungeon.width / 8, dungeon.height / 20);
  outerBar.endFill();
  healthBar.addChild(outerBar);

  healthBar.outer = outerBar;
  healthBar.outer.initialWidth = outerBar.width;
  healthBar.updateHealth = (health, totalHealth) => {
    healthBar.outer.width = (health / totalHealth) *
      healthBar.outer.initialWidth;
  };

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

  left.press = () => player.vx -= linearSpeed;
  left.release = () => player.vx += linearSpeed;
  up.press = () => player.vy += linearSpeed;
  up.release = () => player.vy -= linearSpeed;
  right.press = () => player.vx += linearSpeed;
  right.release = () => player.vx -= linearSpeed;
  down.press = () => player.vy -= linearSpeed;
  down.release = () => player.vy += linearSpeed;
  reloadButton.press = () => playerBulletPool.reload();

  sound.play('mainMenu', {
    loop: true,
    speed: 1,
    volume: 0.3
  });

  animate();
}

function ResetLevel() {
  botLevel.removeChildren();

  tempScore = 0;

  botLevel.addChild(dungeon);

  player = new PIXI.extras.AnimatedSprite(playerStaleRight);
  player.position.set(renderer.width / 4, renderer.height / 2);
  player.vx = 0;
  player.vy = 0;
  player.scale.set(1.5);
  player.shooting = false;
  player.shootingTimeout = gunTimeout;
  player.initialHealth = 100;
  player.health = player.initialHealth;
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

  ammoLeftText.text = playerBulletPool.getBulletsLeft() +
    ' / ' + playerBulletPool.getBulletsAmount();
  reloadText.visible = false;
  healthBar.updateHealth(player.health, player.initialHealth);
  botLevel.addChild(ammoLeftText);
  botLevel.addChild(reloadText);
  botLevel.addChild(healthBar);

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

function WaveCleared(wave, step, firstWave) {
  switch (step) {
  case 1: {
    waveText = new PIXI.Text('WAVE ' + wave + ' CLEARED', waveTextStyle);
    waveText.anchor.set(0.5);
    waveText.position.set(renderer.width / 2, renderer.height / 2.5);
    waveText.visible = !firstWave;

    botLevel.addChild(waveText);
    break;
  }
  case 2: {
    waveText.text = 'WAVE ' + wave + ' STARTING...';
    waveText.visible = true;
    break;
  }
  case 3: {
    waveText.visible = false;
    botLevel.removeChild(waveText);

    waveCountdown = new PIXI.Text('3', waveCountdownStyle);
    waveCountdown.anchor.set(0.5);
    waveCountdown.scale.set(1);
    waveCountdown.position.set(renderer.width / 2, renderer.height / 2);
    waveCountdown.visible = true;
    botLevel.addChild(waveCountdown);
    break;
  }
  case 4: {
    waveCountdown.scale.set(1);
    waveCountdown.text = '2';
    break;
  }
  case 5: {
    waveCountdown.scale.set(1);
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
    creature.position.x += creature.vx;
  }
  if (creatureCollisions.y === collisionType.no ||
    ((creatureCollisions.y === collisionType.top) && (creature.vy <= 0)) ||
    ((creatureCollisions.y === collisionType.down) && (creature.vy >= 0))
  ) {
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

async function animate() {
  if (gameState === GAME_STATES.waiting) {
    renderer.render(waitingScreen);
  } else if (gameState === GAME_STATES.botLevel && player.isAlive) {
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
    setDeathScreen = false;
    gameState = GAME_STATES.deathScreen;
    renderer.render(deathScreen);
  } else if (gameState === GAME_STATES.deathScreen) {
    if (!setDeathScreen) {

      deathScreen.removeChildren();
      deathText.text = 'YOU DIED WITH SCORE: ' + tempScore;
      deathScreen.addChild(deathText);
      deathScreen.addChild(restartButton);
      deathScreen.addChild(exitButton);

      // Text hint
      const textHint = new PIXI.Text('Enter your name:', scoreLineStyle);
      textHint.position.set(renderer.width / 6, renderer.height / 3 - 50);
      deathScreen.addChild(textHint);

      // Text input component
      nameInput = new PIXI.Container();
      const style = { fontFamily: 'Arial', fontSize: 40, fill: 0x000000 };
      const inputField = new PixiTextInput('', style);
      inputField.width = renderer.width / 4;
      nameInput.addChild(inputField);
      nameInput.position.set(
        renderer.width / 6 * 2.8,
        renderer.height / 3 - 44
      );

      deathScreen.addChild(nameInput);
      setDeathScreen = true;
    }

    renderer.render(deathScreen);
  } else if (gameState === GAME_STATES.tutorialScreen) {
    renderer.render(tutorialScreen);
  } else if (gameState === GAME_STATES.mainMenu) {
    renderer.render(mainMenuScreen);

    if (ableToPost && !PostedData) {
      const text = (nameInput.children[0].text === '' ?
        'EmptyName' :
        nameInput.children[0].text);
      const result = await fetch(`upload/?name=${text}&score=${tempScore}`,
        {
          method: 'POST'
        });
      console.log(result);

      nameInput.children[0].text = '';

      PostedData = true;
    }

    if (titleText.rotation >= 0.1) rotation = rotNeg;
    else if (titleText.rotation <= -0.1) rotation = rotPos;
    titleText.rotation += rotation;
  } else if (gameState === GAME_STATES.scoreScreen) {
    if (!fetchedData) {

      scoreData = await (await fetch('/scores', { method: 'GET' })).json();

      const offsetY = renderer.height / 9,
        prevX1 = renderer.width / 5,
        prevX2 = renderer.width / 5 * 2.75,
        origY = renderer.height / 12;
      let prevY = origY;

      scoreScreen.removeChildren();

      const scoreText = new PIXI.Text(
        'TOP-10 SCORES', scoreTitleStyle);
      scoreText.anchor.set(0.5);
      scoreText.position.set(
        renderer.width / 2,
        prevY
      );
      scoreText.visible = true;
      scoreText.interactive = false;
      scoreScreen.addChild(scoreText);

      for (
        let i = 0;
        i < (scoreData.length >= 10 ?
          10 :
          scoreData.length);
        i++) {
        const gamer = scoreData[i];
        const scoreLineText = new PIXI.Text(
          i + 1 + ') ' +
          (gamer.name.length > 10 ?
            gamer.name.slice(0, 7) + '...' :
            gamer.name) +
          ' : ' + gamer.score, scoreLineStyle);
        scoreLineText.position.set(
          (i > 4 ? prevX2 : prevX1),
          prevY + offsetY
        );
        prevY = (i === 4 ? origY : prevY += offsetY);
        scoreLineText.visible = true;
        scoreLineText.interactive = false;
        scoreScreen.addChild(scoreLineText);
      }
      backButton.scale.set(0.5);
      backButton.position.set(renderer.width / 2, origY + offsetY * 7);
      scoreScreen.addChild(backButton);

      fetchedData = true;
    }
    renderer.render(scoreScreen);
  }

  requestAnimationFrame(await animate);
}
