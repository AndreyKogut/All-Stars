const _ = require('lodash');
const Users = require('../../api/users/model');
const config = require('../settings.json');

module.exports = {
  getClient,
  grantTypeAllowed,
  getUser,
  saveAccessToken,
  saveRefreshToken,
  getAccessToken,
  getRefreshToken,
};

function getClient(clientId, clientSecret, callback) {
  if (clientId === config.client_id && clientSecret === config.client_secret) {
    callback(null, {
      clientId,
      redirectUri: '/',
    });
  } else {
    callback();
  }
}

function grantTypeAllowed(clientId, grantType, callback) {
  if (_.indexOf(config.grants, grantType) + 1) {
    callback(null, grantType);
  } else {
    callback();
  }
}

function getUser(username, password, callback) {
  Users.findOne({ username }, (err, user) => {
    if (err) {
      callback();
    } else {
      callback(null, user);
    }
  });
}

function saveAccessToken(accessToken, clientId, expires, user, callback) {
  const where = { _id: user._id };
  const doc = {
    $push: {
      'auth.accessTokens': {
        token: accessToken,
        expires,
      }
    }
  };

  Users.findOneAndUpdate(where, doc, (err) => {
    if (err) {
      callback(err);
    } else {
      callback();
    }
  });
}

function saveRefreshToken(refreshToken, clientId, expires, user, callback) {
  const where = { _id: user._id };
  const doc = {
    $push: {
      'auth.refreshTokens': {
        token: refreshToken,
        expires,
      }
    }
  };

  Users.findOneAndUpdate(where, doc, (err) => {
    if (err) {
      callback(err);
    } else {
      callback();
    }
  });
}

function getAccessToken(bearerToken, callback) {
  const where = {
    'auth.accessTokens.token': bearerToken,
  };

  Users.findOne(where, (err, user) => {
    if (!user) {
      callback();
    } else {
      const tokenData = _.findLast(user.auth.accessTokens, { token: bearerToken });
      const profile = _.omit(user.toJSON(), ['password', 'auth']);

      callback(null, {
        expires: tokenData.expires,
        user: profile,
      });
    }
  });
}

function getRefreshToken(refreshToken, callback) {
  const findWhere = {
    'auth.refreshTokens.token': refreshToken,
  };

  const deleteWhere = {
    'auth.refreshTokens.token': refreshToken,
  };

  const deleteDoc = {
    $pull: {
      'auth.refreshTokens': { $or: [ { expires: { $lte: new Date() } }, { token: refreshToken } ]},
      'auth.accessTokens': { expires: { $lte: new Date() } },
    },
  };

  Users.findOne(findWhere, (err, user) => {
    if (!user) {
      callback();
    } else {
      const tokenData = _.findLast(user.auth.refreshTokens, { token: refreshToken });

      Users.findOneAndUpdate(deleteWhere, deleteDoc);

      callback(null, {
        clientId: config.client_id,
        expires: tokenData.expires,
        user: {
          _id: user._id
        },
      });
    }
  });
}
