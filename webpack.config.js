const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

module.exports = (env, argv) => {
  const isProduction = argv.mode === 'production';

  return {
    entry: './src/index.jsx',

    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: isProduction ? 'js/[name].[contenthash:8].js' : 'js/[name].js',
      assetModuleFilename: 'assets/[name].[contenthash:8][ext]',
      publicPath: '/',
      clean: true,
    },

    resolve: {
      extensions: ['.js', '.jsx'],
    },

    devtool: isProduction ? 'source-map' : 'eval-cheap-module-source-map',

    module: {
      rules: [
        {
          test: /\.(js|jsx)$/,
          exclude: /node_modules/,
          use: 'babel-loader',
        },
        {
          test: /\.css$/,
          use: [
            // Em produção o CSS vai para arquivos próprios; em desenvolvimento é injetado via <style>.
            isProduction ? MiniCssExtractPlugin.loader : 'style-loader',
            'css-loader',
          ],
        },
        {
          test: /\.(png|jpe?g|gif|svg|webp|ico)$/i,
          type: 'asset/resource',
        },
        {
          test: /\.(woff2?|ttf|otf|eot)$/i,
          type: 'asset/resource',
          generator: {
            filename: 'fonts/[name].[contenthash:8][ext]',
          },
        },
      ],
    },

    plugins: [
      new HtmlWebpackPlugin({
        template: './public/index.html',
        favicon: './public/favicon.svg',
      }),
      isProduction &&
        new MiniCssExtractPlugin({
          filename: 'css/[name].[contenthash:8].css',
        }),
    ].filter(Boolean),

    devServer: {
      port: 3000,
      open: true,
      hot: true,
      historyApiFallback: true,
      client: {
        overlay: true,
      },
    },

    performance: {
      hints: isProduction ? 'warning' : false,
    },
  };
};
