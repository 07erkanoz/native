module.exports = {
  presets: ['module:@react-native/babel-preset'],
  plugins: [
    [
      'module-resolver',
      {
        root: ['./src'],
        extensions: ['.ios.js', '.android.js', '.js', '.ts', '.tsx', '.json'],
        alias: {
          '@': './src',
          '@components': './src/components',
          '@screens': './src/screens',
          '@services': './src/services',
          '@hooks': './src/hooks',
          '@utils': './src/utils',
          '@types': './src/types',
          '@store': './src/store',
          '@assets': './src/assets',
          '@theme': './src/theme',
          '@i18n': './src/i18n',
        },
      },
    ],
    'react-native-reanimated/plugin', // Must be last
  ],
};
