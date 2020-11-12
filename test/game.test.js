const { test, expect, describe } = require('@jest/globals');
const { stageLevel,
  playerBulletPool,
  player,
  dungeon,
  renderer,
  playerRunningLeft,
  playerRunningRight,
  AnimatePlayer } =
  require('../src/scripts/game');

describe('tests', () => {
  test('stage is initialized and contains children', () => {
    expect(stageLevel.children.length).toBeGreaterThan(0);
  });

  test('player shoot with bullet explosion', () => {
    player.shooting = true;
    const prev = playerBulletPool.getBulletsLeft();
    playerBulletPool.shoot(0, 0);
    playerBulletPool.updateBulletsSpeed();
    const post = playerBulletPool.getBulletsLeft();
    expect(post).toBeLessThan(prev);
  });

  test('player shoot without bullet explosion', () => {
    dungeon.scale._x = 1000;
    dungeon.scale._y = 1000;
    player.shooting = true;
    const prev = playerBulletPool.getBulletsLeft();
    playerBulletPool.shoot(200, 200);
    playerBulletPool.updateBulletsSpeed();
    const post = playerBulletPool.getBulletsLeft();
    expect(post).toBeLessThan(prev);
  });

  test('player shoot with reload', () => {
    player.shooting = true;
    for (let i = 0; i <= playerBulletPool.getBulletsAmount(); i++) {
      playerBulletPool.shoot(0, 0);
      playerBulletPool.updateBulletsSpeed();
    }
    playerBulletPool.reload();
    for (let i = 0; i <= playerBulletPool.getReloadSpeed() + 10; i++) {
      playerBulletPool.updateBulletsSpeed();
    }
    expect(playerBulletPool.getBulletsLeft()).
      toBe(playerBulletPool.getBulletsAmount());
    playerBulletPool.shoot(0, 0);
    expect(playerBulletPool.getBulletsLeft()).
      toBeLessThan(playerBulletPool.getBulletsAmount());
  });

  test('run right', () => {
    expect(AnimatePlayer(player.x + 10)).toBe(playerRunningRight);
  });

  test('run left', () => {
    expect(AnimatePlayer(player.x - 10)).toBe(playerRunningLeft);
  });
});
