const dotEnvValues = require('dotenv').config();
const path = require('path');
const webpack = require('webpack');
const HTMLWebpackPlugin = require('html-webpack-plugin');
const MiniCSSExtract = require('mini-css-extract-plugin');
const FaviconsWebpackPlugin = require('favicons-webpack-plugin');

const basePath = __dirname;
const distPath = 'dist';

const indextInput = './src/index.ejs';
const indexOutput = 'index.html';

const envVariables = (env) =>
    Object.entries(env).reduce(
      (acc, [attribute, value]) => {
        acc[attribute] = JSON.parse(value);
        return acc;
      },
      {
        ...process.env,
        ...dotEnvValues.parsed,
        ...(!!JSON.parse(env.mock || false)
          ? { WP_ENDPOINT: process.env.WP_MOCK_ENDPOINT }
          : {}),
      },
    );
  

function webpackConfigGenerator(env) {
  const isDevelopment = !!JSON.parse(env.development);
  const sourcemaps = isDevelopment;
  const localIdentName = isDevelopment
    ? '[local]--[hash:base64:5]'
    : '[hash:base26:5]';

  const isMock = !!env.mock;
  const ENV = envVariables(env);

  const webpackInitConfig = {
    resolve: {
      extensions: ['.js', '.ts', '.tsx', '.scss'],
      modules: [path.resolve('./src'), 'node_modules'],
    },
    entry: {
      app: ['./src/index.tsx'],
    },
    output: {
      path: path.join(basePath, distPath),
      filename: '[chunkhash][name].js',
    },
    module: {
      rules: [
        {
          test: /\.tsx?/,
          exclude: /node_modules|test.tsx?|stories.tsx?/,
          use: [
            {
              loader: 'ts-loader',
              options: {
                onlyCompileBundledFiles: true,
              },
            },
            'tslint-loader',
          ],
        },
        {
          test: /\.css/,
          exclude: /node_modules/,
          use: [
            MiniCSSExtract.loader,
            { loader: 'css-loader', options: { sourceMap: sourcemaps } },
            { loader: 'postcss-loader', options: { sourceMap: sourcemaps } },
          ],
        },
        {
          test: /\.scss/,
          exclude: /node_modules/,
          use: [
            MiniCSSExtract.loader,
            'css-modules-typescript-loader',
            {
              loader: 'css-loader',
              options: {
                sourceMap: sourcemaps,
                modules: true,
                localIdentName,
              },
            },
            {
              loader: 'postcss-loader',
              options: { sourceMap: sourcemaps, modules: true },
            },
            {
              loader: 'sass-loader',
              options: { sourceMap: sourcemaps, modules: true },
            },
          ],
        },
        {
          test: /\.(png|jpg|gif|woff2)$/,
          use: [
            {
              loader: 'file-loader',
            },
          ],
        },
      ],
    },
    plugins: [
      new HTMLWebpackPlugin({
        filename: indexOutput,
        template: indextInput,
        baseUrl: ENV.BASE_URL,
      }),
      new MiniCSSExtract({
        filename: '[chunkhash][name].css',
        chunkFilename: '[id].css',
      }),
      new webpack.DefinePlugin({ENV: JSON.stringify({
        WP_ENDPOINT: ENV.WP_ENDPOINT,
        VERSION: require('./package.json').version
      })}),
      new FaviconsWebpackPlugin({
        logo:'./src/assets/favicon.jpg',
        prefix: './',
      })
    ],
  };
  
  return webpackInitConfig;
}

module.exports = webpackConfigGenerator;
