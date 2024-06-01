const { BytenodeWebpackPlugin } = require("@herberttn/bytenode-webpack-plugin");
const rules = require("./webpack.rules");

/** @type {import("webpack").Configuration} */
module.exports = {
  entry: { preload: "./preload.js" },
  output: {
    filename: "[name].js",
    devtoolModuleFilenameTemplate: "[absolute-resource-path]",
  },
  module: {
    rules,
  },
  plugins: [new BytenodeWebpackPlugin({ compileForElectron: true })],
  target: 'electron-preload'
};