const { BytenodeWebpackPlugin } = require('@herberttn/bytenode-webpack-plugin');
const rules = require('./webpack.rules');

/** @type {import("webpack").Configuration} */
module.exports = {
  output: { devtoolModuleFilenameTemplate: '[absolute-resource-path]' },
  module: {
    rules: [
      ...rules,
      {
        test: /\.css$/,
        use: [
          {
            loader: 'style-loader',
          },
          {
            loader: 'css-loader',
          }
        ],
      },
    ],
  },
  plugins: [new BytenodeWebpackPlugin({ compileForElectron: true })],
  target: 'electron-renderer'
};