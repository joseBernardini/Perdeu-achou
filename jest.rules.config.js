module.exports = {
  testEnvironment: 'node',
  roots: ['<rootDir>/test/rules'],
  transform: {
    '^.+\\.js$': 'babel-jest',
  },
  testTimeout: 30000,
};
