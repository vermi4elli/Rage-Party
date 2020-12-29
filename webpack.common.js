'use strict';

const path = require('path');
module.exports = {

  //context directory is src
  context: path.join(__dirname, 'src'),
  //entry file of the project,(relative to context)
  // entry: ['./scripts/game.js'],
  entry: ['./scripts/game.js'],
  devtool: 'source-map',
  output: {
    path: path.resolve(__dirname, 'dist'),
    publicPath: '/',
    filename: 'game.min.js'
  },
  target: 'web',
  resolve: {
    extensions: ['.webpack.js', '.web.js', '.ts', '.tsx', '.js'],
    fallback: { 'path': false }
  },
  module: {
    rules: [
      // All files with a '.ts' or '.tsx' extension
      // will be handled by 'ts-loader'.
      { test: /\.tsx?$/, loader: 'ts-loader' },

      // All output '.js' files will have any sourcemaps
      // re-processed by 'source-map-loader'.
      { test: /\.js$/, loader: 'source-map-loader' },
    ],
  },
};
