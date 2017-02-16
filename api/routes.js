const oauthController = require('./oauth/constroller');
const usersController = require('./users/controller');
const storiesController = require('./stories/controller');

module.exports = routes;

function routes(server) {
  oauthController(server);
  usersController(server);
  storiesController(server);
}
