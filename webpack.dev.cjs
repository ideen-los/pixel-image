const { merge } = require('webpack-merge');
const common = require('./webpack.common.cjs');

module.exports = merge(common, {
  mode: 'development',
  devtool: 'inline-source-map',
  devServer: {
    static: './dist',
    compress: true,
    port: 8080,
    open: true,
    proxy: {
      '/pay': 'http://localhost:3000',
      '/complete-order': 'http://localhost:3000',
      '/cancel-order': 'http://localhost:3000',
      // Add other API routes as needed
    },
  },
  module: {
    rules: [
      {
        test: /\.scss$/,
        use: [
          'style-loader', // Injects CSS into the DOM
          'css-loader', // Turns CSS into CommonJS
          'sass-loader', // Compiles SCSS to CSS
        ],
      },
      {
        test: /\.css$/,
        use: [
          'style-loader', // Injects CSS into the DOM
          'css-loader', // Turns CSS into CommonJS
        ],
      },
    ],
  },
});
