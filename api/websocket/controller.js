const webSocket = require('express-ws');
const Users = require('../users/model');

module.exports = wsController;

function wsController(app) {
  const wsInstance = webSocket(app);

  app.ws('/chat/:id', joinChat, (socket, req) => {
    socket.on('message', (message) => {
      wsInstance.getWss().clients
        .forEach((client) => {
          if (client.upgradeReq.path === req.path) {
            client.send(JSON.stringify({
              user: req.user,
              message: JSON.parse(message),
            }));
          }
        });
    });
  });
}

function joinChat(socket, req, next) {
  const where = {
    'auth.accessTokens.token': req.query.token,
    'auth.accessTokens.expires': { $lt: new Date() },
  };
  const options = { auth: 0, password: 0, __v: 0 };

  Users.findOne(where, options, (err, user) => {
    if (err || !user) {
      socket.close(1000, 'Unauthorized');
    } else {
      req.user = user;
      next();
    }
  });
}
