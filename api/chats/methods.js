const _ = require('lodash');

module.exports = {
  endChat,
  sendMessage,
  changeTheme,
  banUser,
  cleanUp,
};

function endChat(server, chatId) {
  server.wsInstance.getWss().clients
    .forEach((client) => {
      if (_.indexOf(client.subscriptions, chatId) + 1) {
        client.send(JSON.stringify({
          type: 'end',
          chatId: chatId,
        }));
      }
    });
}

function sendMessage(server, req, message, blacklist) {
  server.wsInstance.getWss().clients
    .forEach((client) => {
      const isClientSubscribed =
        !!(_.indexOf(client.subscriptions, message.chatId) + 1);

      const isClientBanned = _.some(blacklist,
        userId => String(userId) === String(client.user._id));

      if (isClientSubscribed && !isClientBanned) {
        client.send(JSON.stringify({
          type: 'message',
          user: req.user,
          message: message.text,
        }));
      }
    });
}

function changeTheme(server, chat) {
  server.wsInstance.getWss().clients
    .forEach((client) => {
      if (_.indexOf(client.subscriptions, String(chat._id)) + 1) {
        client.send(JSON.stringify({
          type: 'theme',
          chatId: chat._id,
          theme: chat.theme,
        }));
      }
    });
}

function banUser(server, chatId, userId) {
  server.wsInstance.getWss().clients
    .forEach((client) => {
      if (client.user._id === userId) {
        client.subscriptions = _.pull(client.subscriptions, chatId);
        client.send(JSON.stringify({
          type: 'ban',
          chatId,
        }));
      } else {
        if (_.indexOf(client.subscriptions, chatId) + 1) {
          client.send(JSON.stringify({
            type: 'userBaned',
            userId,
          }));
        }
      }
    });
}

function cleanUp(server, chatId) {
  server.wsInstance.getWss().clients
    .forEach((client) => {
      if (_.indexOf(client.subscriptions, chatId) + 1) {
        client.send(JSON.stringify({
          type: 'cleanup',
          chatId,
        }));
      }
    });
}
