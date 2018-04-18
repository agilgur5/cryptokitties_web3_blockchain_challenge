var path = require('path')

// webpack's configuration
module.exports = {
  entry: {
    app: './app.js',
  },
  output: {
    path: path.join(__dirname, 'build'), // where builds go
    filename: '[name].bundle.js'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        loader: 'babel-loader',
        query: { presets: ['es2015', 'react', 'stage-1'] }
      }
    ]
  },
  mode: process.env.NODE_ENV
}
