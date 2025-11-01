module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { 
        jsxImportSource: "nativewind",
        jsxRuntime: "automatic"
      }],
      "nativewind/babel",
    ],
    plugins: [
      // Add any additional plugins if needed
    ],
  };
};