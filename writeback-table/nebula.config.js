// nebula.config.js
module.exports = {
  build: {
    webpack(config) {
      // Add babel-loader for JSX
      config.module.rules.push({
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: ["@babel/preset-env", "@babel/preset-react"],
          },
        },
      });

      // Enable resolving .jsx extensions
      config.resolve.extensions = [".js", ".jsx", ".json"];

      // Define process.env
      if (!config.plugins) {
        config.plugins = [];
      }

      // Add process definition
      config.resolve.fallback = {
        ...config.resolve.fallback,
        process: require.resolve("process/browser"),
      };

      // Define a global process variable
      const webpack = require("webpack");
      config.plugins.push(
        new webpack.ProvidePlugin({
          process: "process/browser",
        })
      );

      return config;
    },
  },
};
