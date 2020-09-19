const path = require('path');

module.exports = {
  client: {
    tagName: 'gql',
    includes: [
      './packages/frontend/**/*.js',
      './packages/frontend/**/*.ts',
      './packages/frontend/**/*.tsx',
    ],
    service: {
      name: 'validations',
      localSchemaFile: path.join(
        __dirname,
        'packages',
        'graphql-schema',
        'dist',
        'index.json'
      ),
      url: 'http://localhost:4000/graphql',
    },
  },
};
