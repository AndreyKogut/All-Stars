const oauthController = require('./oauth/constroller');
const usersController = require('./users/controller');
const storiesController = require('./stories/controller');
const eventController = require('./events/controller');

module.exports = routes;

function routes(server) {
  oauthController(server);
  usersController(server);
  storiesController(server);
  eventController(server);
}
