'use strict';

const renderer =
  PIXI.autoDetectRenderer(800, 600, { backgroundColor: 0x1099bb });
document.body.appendChild(renderer.view);

// create the root of the scene graph
const stage = new PIXI.Container();

// create a new Sprite using the texture
const player = new PIXI.Sprite(bunnyTexture);


// center the sprite's anchor point
player.anchor.x = 0.5;
player.anchor.y = 0.5;

// move the sprite to the center of the screen
player.position.x = 200;
player.position.y = 150;

player.vx = 0;
player.vy = 0;

const gunTimeout = 10;
player.shooting = false;
player.shootingTimeout = gunTimeout;

const background = new PIXI.Graphics();
background.beginFill(0x123456);
background.drawRect(0, 0, 800, 600);
background.endFill();
stage.addChild(background);

stage.addChild(player);

stage.interactive = true;

stage.on('mousedown', event => {
  player.shooting = true;
});

stage.on('mouseup', event => {
  player.shooting = false;
  player.shootingTimeout = gunTimeout;
});

// yet to make it modular
const bullets = [];
const bulletSpeed = 10;

function shoot(rotation, startPosition) {
  const bullet = new PIXI.Sprite(bulletTexture);
  bullet.position.x = startPosition.x;
  bullet.position.y = startPosition.y;
  bullet.scale.x = 0.2;
  bullet.scale.y = 0.2;
  bullet.rotation = rotation;
  stage.addChild(bullet);
  bullets.push(bullet);
}

function rotateToPoint(mx, my, px, py) {
  const self = this;
  const dist_Y = my - py;
  const dist_X = mx - px;
  //var degrees = angle * 180/ Math.PI;
  return Math.atan2(dist_Y, dist_X); // the angle
}

// start animating
animate();
function animate() {
  requestAnimationFrame(animate);

  player.position.x += player.vx;
  player.position.y += player.vy;

  if (player.shooting) {
    if (player.shootingTimeout === gunTimeout) {
      player.shootingTimeout = 0;
      shoot(rotateToPoint(renderer.plugins.interaction.mouse.global.x,
        renderer.plugins.interaction.mouse.global.y,
        player.position.x,
        player.position.y),
      {
        x: player.position.x + Math.cos(player.rotation) * 20,
        y: player.position.y + Math.sin(player.rotation) * 20
      }
      );
    }
    ++player.shootingTimeout;
  }

  for (let b = bullets.length - 1; b >= 0; b--) {
    bullets[b].position.x += Math.cos(bullets[b].rotation) * bulletSpeed;
    bullets[b].position.y += Math.sin(bullets[b].rotation) * bulletSpeed;
  }
  // render the container
  renderer.render(stage);
}
