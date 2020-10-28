'use strict';

const path = require('path');
module.exports = {

  //context directory is src
  context: path.join(__dirname, 'src'),
  //entry file of the project,(relative to context)
  entry: ['./scripts/game.js'],
  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
    filename: 'game.min.js'
  },
  target: 'web'
};
