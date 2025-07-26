const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Enable bundle splitting and optimization
config.transformer = {
  ...config.transformer,
  minifierConfig: {
    mangle: {
      keep_fnames: true,
    },
    output: {
      ascii_only: true,
      quote_style: 3,
      wrap_iife: true,
    },
    sourceMap: {
      includeSources: false,
    },
    toplevel: false,
    warnings: false,
  },
};

// Optimize resolver for better tree shaking
config.resolver = {
  ...config.resolver,
  alias: {
    '@': './src',
    '@components': './src/components',
    '@screens': './src/screens',
    '@services': './src/services',
    '@store': './src/store',
    '@utils': './src/utils',
    '@hooks': './src/hooks',
    '@types': './src/types',
  },
};

// Enable experimental features for better performance
config.serializer = {
  ...config.serializer,
  customSerializer: null,
};

module.exports = config;