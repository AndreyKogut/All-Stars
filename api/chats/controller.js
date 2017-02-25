const _ = require('lodash');
const Chats = require('./model');
const Users = require('../users/model');
const chatMethods = require('./methods');
const validation = require('../helpers/validation');
const ASError = require('../helpers/Error');
const errorHandler = require('../helpers/callbackErrorHandler');

module.exports = chatController;

function chatController(server) {
  server.post('/api/chat', server.oauth.authorise(), (req, res, next) => {
    const requestDataStructure = {
      theme: {
        optional: true,
        isLength: {
          options: { max: 50 },
          errorMessage: 'Invalid theme length',
        },
      },
    };

    validation(req, requestDataStructure, update);

    function update() {
      const where = {
        owner: req.user._id,
        theme: {
          $ne: req.body.theme,
        },
      };
      const doc = { theme: req.body.theme };

      Chats.findOneAndUpdate(where, doc, { new: true }, errorHandler(res, informUsers));

      function informUsers(chat) {
        if (chat) {
          chatMethods.changeTheme(server, chat);
          res.sendStatus(200);
        } else {
          next(ASError(403, 'Invalid changes'));
        }
      }
    }
  });

  server.put('/api/chat/:state', server.oauth.authorise(), (req, res, next) => {
    const states = {
      on: true,
      off: false,
    };
    const requestedState = req.params.state;

    if (_.has(states, requestedState)) {
      update();
    } else {
      next(new ASError(403, 'Invalid chat state'));
    }

    function update() {
      const where = { owner: req.user._id };
      const doc = { enabled: states[requestedState] };

      // Delete messages if chat closed
      if (!states[requestedState]) {
        doc.messages = [];
      }

      Chats.findOneAndUpdate(where, doc, { new: true }, errorHandler(res, handleChat));
    }

    function handleChat(chat) {
      if (chat) {
        if (!chat.enabled) {
          chatMethods.endChat(server, String(chat._id));
        }

        res.send(chat);
      } else {
        const requestedChatInfo = {
          owner: req.user._id,
          theme: `${req.user.username}'s chat`,
          enabled: states[requestedState],
        };

        const requestedChat = Chats(requestedChatInfo);

        requestedChat.save(errorHandler(req, getChat));
      }
    }

    function getChat(chat) {
      res.send(chat);
    }
  });

  server.put('/api/chat/blacklist/:id', server.oauth.authorise(), (req, res, next) => {
    const requestDataStructure = {
      id: {
        notEmpty: true,
        isValidId: true,
        errorMessage: 'Invalid id',
      },
    };

    validation(req, requestDataStructure, addUser);

    function addUser() {
      const userId = req.params.id;
      const where = {
        $and: [{
          owner: req.user._id,
        }, {
          owner: { $ne: userId },
        }],
        blacklist: {
          $ne: userId,
        },
      };
      const doc = {
        $push: {
          blacklist: userId,
        },
        $pull: {
          messages: {
            creator: userId,
          },
        },
      };

      Chats.findOneAndUpdate(where, doc, errorHandler(res, getChat));

      function getChat(chat) {
        if (chat) {
          chatMethods.banUser(server, String(chat._id), userId);
          res.sendStatus(200);
        } else {
          next(new ASError(403, 'You cant block this user'));
        }
      }
    }
  });

  server.delete('/api/chat/blacklist/:id', server.oauth.authorise(), (req, res) => {
    const requestDataStructure = {
      id: {
        notEmpty: true,
        isValidId: true,
        errorMessage: 'Invalid id',
      },
    };

    validation(req, requestDataStructure, removeUser);

    function removeUser() {
      const userId = req.params.id;
      const where = {
        owner: req.user._id,
      };
      const doc = {
        $pull: {
          blacklist: userId,
        },
      };

      Chats.findOneAndUpdate(where, doc, errorHandler(res));
    }
  });

  server.delete('/api/chat/messages', server.oauth.authorise(), (req, res) => {
    const where = {
      owner: req.user._id,
    };
    const doc = {
      messages: [],
    };

    Chats.findOneAndUpdate(where, doc, errorHandler(res, cleanup));

    function cleanup(chat) {
      chatMethods.cleanUp(server, String(chat._id));
      res.sendStatus(200);
    }
  });

  server.get('/api/chats', server.oauth.authorise(), (req, res, next) => {
    const requestDataStructure = {
      skip: {
        notEmpty: true,
        isInt: true,
        isPositiveNumber: true,
        errorMessage: 'Invalid skip query',
      },
      count: {
        notEmpty: true,
        isInt: true,
        isPositiveNumber: true,
        errorMessage: 'Invalid count query',
      },
    };

    validation(req, requestDataStructure, findChats, next);

    function findChats() {
      const where = {
        $or: [{
          owner: req.user._id,
        }, {
          'messages.creator': req.user._id,
          blacklist: {
            $ne: String(req.user._id),
          },
        }],
      };

      Chats
        .find(where, errorHandler(res, getChats))
        .skip(Number(req.query.skip))
        .limit(Number(req.query.count));
    }

    function getChats(chats) {
      const transform = _.map(chats, chat => _.assignWith(chat.toJSON(), {
        isOwner: chat.owner === String(req.user._id),
      }));

      res.send(transform);
    }
  });

  server.get('/api/profile/chat', server.oauth.authorise(), (req, res) => {
    const where = { owner: req.user._id };

    Chats.findOne(where, errorHandler(res, getChat));

    function getChat(chat) {
      const transform = _.assignWith(chat.toJSON(), {
        isOwner: true,
      });

      res.send(transform);
    }
  });

  server.get('/api/chats/:id', server.oauth.authorise(), (req, res) => {
    const where = { _id: req.params.id };

    Chats.findOne(where, errorHandler(res, getChat));

    function getChat(chat) {
      const transform = _.assignWith(chat.toJSON(), {
        isOwner: chat.owner === String(req.user._id),
      });

      res.send(transform);
    }
  });

  server.get('/api/chats/:id/messages', server.oauth.authorise(), (req, res, next) => {
    const requestDataStructure = {
      from: {
        notEmpty: true,
        isInt: true,
        errorMessage: 'Invalid from query',
      },
      to: {
        notEmpty: true,
        isInt: true,
        isPositiveNumber: true,
        errorMessage: 'Invalid to query',
      },
    };

    validation(req, requestDataStructure, getChat, next);

    function getChat() {
      const where = {
        _id: req.params.id,
        blacklist: {
          $nin: [req.user._id],
        },
      };
      const options = {
        messages: {
          $slice: [Number(req.query.from), Number(req.query.to)],
        },
      };

      Chats.findOne(where, options, errorHandler(res, getMessages));
    }

    function getMessages(chat) {
      if (chat) {
        res.send(chat.messages);
      } else {
        next(new ASError(403, 'Baned by creator'));
      }
    }
  });

  server.ws('/chats', joinChat, (socket, req) => {
    socket.on('message', (messageJSON) => {
      const message = JSON.parse(messageJSON);
      const where = {
        _id: message.chatId,
        blacklist: {
          $ne: String(req.user._id),
        },
        enabled: true,
      };
      const doc = {
        $push: {
          messages: {
            creator: req.user._id,
            text: message.text.trim(),
            date: new Date(),
          },
        },
      };

      Chats.findOneAndUpdate(where, doc, sendMessage);

      function sendMessage(err, chat) {
        if (chat) {
          chatMethods.sendMessage(server, req, message, chat.blacklist);
        }
      }
    });
  });
}

function joinChat(client, req, next) {
  const where = {
    'auth.accessTokens.token': req.query.token,
    'auth.accessTokens.expires': { $gt: new Date() },
  };
  const options = { auth: 0, password: 0, __v: 0 };

  Users.findOne(where, options, (err, user) => {
    if (err || !user) {
      client.close(1000, 'Unauthorized');
    } else {
      const whereChats = {
        $and: [{
          $or: [{
            owner: user._id,
          }, {
            'messages.creator': user._id,
          }],
        }, {
          enabled: true,
        }],
      };

      Chats.find(whereChats, getChats);

      function getChats(err, chats) {
        req.user = user;
        client.user = user;
        client.subscriptions = chats
          .filter(chat => !_.indexOf(chat.blacklist, user._id) + 1)
          .map(chat => String(chat._id));

        next();
      }
    }
  });
}
