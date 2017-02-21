const oauthController = require('./oauth/constroller');
const usersController = require('./users/controller');
const storiesController = require('./stories/controller');
const eventsController = require('./events/controller');
const chatsController = require('./chats/controller');
const imagesController = require('./images/controller');

module.exports = routes;

function routes(server) {
  oauthController(server);
  usersController(server);
  storiesController(server);
  eventsController(server);
  chatsController(server);
  imagesController(server);
}
