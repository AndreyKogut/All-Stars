const oauthController = require('./oauth');
const usersController = require('./users');

module.exports = routes;

function routes(server) {
  oauthController(server);
  usersController(server);
}
