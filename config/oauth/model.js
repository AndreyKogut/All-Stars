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
  if (grantType === config.request_grant) {
    callback(null, true);
  } else {
    callback();
  }
}

function getUser(username, password, callback) {
  Users.findOne({ email: username }, (err, user) => {
    console.log(username, user, err);
    if (err) callback();

    callback(null, user);
  });
}

function saveAccessToken(accessToken, clientId, expires, user, callback) {
  Users.findOneAndUpdate({ _id: user._id }, {
    $push: {
      'auth.accessTokens': {
        token: accessToken,
        expires,
      }
    }
  }, {}, (err) => {
    if (err) {
      callback(err);
    }

    callback();
  });
}

function saveRefreshToken(refreshToken, clientId, expires, user, callback) {
  Users.findOneAndUpdate({ _id: user._id }, {
    $push: {
      'auth.refreshTokens': {
        token: refreshToken,
        expires,
      }
    }
  }, {}, (err) => {
    if (err) {
      callback(err);
    }

    callback();
  });
}

function getAccessToken(bearerToken, callback) {
}

function getRefreshToken(refreshToken, callback) {
}
