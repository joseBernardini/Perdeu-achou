module.exports = {
  testEnvironment: 'jsdom',
  roots: ['<rootDir>/src'],
  moduleFileExtensions: ['js', 'jsx'],
  transform: {
    '^.+\\.(js|jsx)$': 'babel-jest',
  },
  moduleNameMapper: {
    '\\.css$': '<rootDir>/test/mocks/styleMock.js',
    '\\.(png|jpe?g|gif|svg|webp|ico|woff2?|ttf|otf|eot)$': '<rootDir>/test/mocks/fileMock.js',
  },
  setupFilesAfterEnv: ['<rootDir>/test/setupTests.js'],
};
