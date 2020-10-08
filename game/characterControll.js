'use strict';

const linearSpeed = 5;

const left = keyboard('a'),
  up = keyboard('w'),
  right = keyboard('d'),
  down = keyboard('s');

left.press = () => {
  player.vx -= linearSpeed;
};
left.release = () => {
  player.vx += linearSpeed;
};

up.press = () => {
  player.vy -= linearSpeed;
};
up.release = () => {
  player.vy += linearSpeed;
};

right.press = () => {
  player.vx += linearSpeed;
};
right.release = () => {
  player.vx -= linearSpeed;
};

down.press = () => {
  player.vy += linearSpeed;
};
down.release = () => {
  player.vy -= linearSpeed;
};
