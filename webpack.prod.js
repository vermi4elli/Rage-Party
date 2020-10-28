'use strict';

const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
module.exports = merge(common, {
  'mode': 'production',
  devtool: 'source-map',
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /(node_modules|bower_components)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/env', {
                'modules': false
              }]
            ],
            plugins: ['@babel/syntax-dynamic-import']
          }
        }
      }
    ]
  }
});
