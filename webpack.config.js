const path = require('path');

module.exports = {
  entry: [
    './client/src/index.js',
    './client/src/styles/style.less'
  ],
  output: {
    path: `${__dirname}/client/app/`,
    filename: 'bundle.js'
  },
  module: {
    loaders: [{
      test: /\.js$/,
      loader: 'babel-loader',
      query: {
        presets: ['react', 'es2015', 'stage-2'],
      }
    }, {
      test: /\.less$/,
      loader: "style-loader!css-loader!autoprefixer-loader!less-loader"
    }]
  },
};
