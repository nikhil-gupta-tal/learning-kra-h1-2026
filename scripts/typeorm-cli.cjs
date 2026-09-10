// required for the migrations to resolve the path aliases correctly
require('ts-node/register');
require('tsconfig-paths/register');

if (process.argv[2] === 'seed') {
  require('../src/database/seeds/seed');
} else {
  require('typeorm/cli');
}
