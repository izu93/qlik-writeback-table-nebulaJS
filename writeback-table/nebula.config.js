// nebula.config.js
const webpack = require("webpack");

module.exports = {
  build: {
    webpack(config) {
      // Add babel-loader for JSX with explicit configuration
      config.module.rules.push({
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: "babel-loader",
          options: {
            presets: [
              "@babel/preset-env",
              ["@babel/preset-react", { runtime: "classic" }],
            ],
            plugins: ["@babel/plugin-transform-react-jsx"],
          },
        },
      });

      // Enable resolving .jsx extensions
      config.resolve.extensions = [".js", ".jsx", ".json"];

      // Add process definition
      config.resolve.fallback = {
        ...config.resolve.fallback,
        process: require.resolve("process/browser"),
      };

      // Define a global process variable
      config.plugins.push(
        new webpack.ProvidePlugin({
          process: "process/browser",
        })
      );

      return config;
    },
  },
};
