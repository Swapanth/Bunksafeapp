const { getDefaultConfig } = require("expo/metro-config");
const { withNativeWind } = require('nativewind/metro');
const path = require('path');
 
const config = getDefaultConfig(__dirname);

// Configure resolver to handle path aliases
config.resolver = {
  ...config.resolver,
  extraNodeModules: {
    '@': path.resolve(__dirname),
  },
};
 
module.exports = withNativeWind(config, { input: './global.css' });