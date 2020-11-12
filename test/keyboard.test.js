const { test, expect } = require('@jest/globals');
const { keyboard } = require('../src/scripts/keyboard');

const left = keyboard('KeyA');
left.press = () => left.ok = 'lol';
left.release = () => left.ok = 'lol lol';

test('testing keydown event downHandler handling', () => {
  window.dispatchEvent(new KeyboardEvent('keydown', { 'code': 'KeyA' }));
  expect(left.isDown).toEqual(true);
  expect(left.isUp).toEqual(false);
});

test('testing keyup event upHandler handling', () => {
  window.dispatchEvent(new KeyboardEvent('keyup', { 'code': 'KeyA' }));
  expect(left.isUp).toEqual(true);
  expect(left.isDown).toEqual(false);
});
