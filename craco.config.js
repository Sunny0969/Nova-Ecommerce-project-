/**
 * Isolate heavy admin-only vendors (jodit, recharts, socket.io-client)
 * into async chunks — never merged into the main / storefront bundles.
 *
 * PostCSS PurgeCSS runs via postcss.config.js (production builds only).
 */
const { createCrawlHtmlMiddleware } = require('./scripts/dev-crawl-middleware');

module.exports = {
  style: {
    postcss: {
      mode: 'file'
    }
  },
  devServer: {
    setupMiddlewares: (middlewares, devServer) => {
      if (process.env.NODE_ENV === 'production') {
        devServer.app.use(createCrawlHtmlMiddleware());
      }
      return middlewares;
    }
  },
  webpack: {
    configure: (webpackConfig) => {
      const splitChunks = webpackConfig.optimization?.splitChunks || {};
      const cacheGroups = splitChunks.cacheGroups || {};

      webpackConfig.optimization = {
        ...webpackConfig.optimization,
        splitChunks: {
          ...splitChunks,
          cacheGroups: {
            ...cacheGroups,
            adminJodit: {
              test: /[\\/]node_modules[\\/](jodit|jodit-react)[\\/]/,
              name: 'admin-jodit',
              chunks: 'async',
              priority: 60,
              enforce: true,
              reuseExistingChunk: true
            },
            adminRecharts: {
              test: /[\\/]node_modules[\\/]recharts[\\/]/,
              name: 'admin-recharts',
              chunks: 'async',
              priority: 60,
              enforce: true,
              reuseExistingChunk: true
            },
            adminSocketIo: {
              test: /[\\/]node_modules[\\/]socket\.io-client[\\/]/,
              name: 'admin-socket-io',
              chunks: 'async',
              priority: 60,
              enforce: true,
              reuseExistingChunk: true
            }
          }
        }
      };

      return webpackConfig;
    }
  }
};
