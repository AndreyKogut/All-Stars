const Oauth2Server = require('oauth2-server');
const config = require('../settings.json');
const model = require('./model');

module.exports = oauthConfig;

function oauthConfig(server) {
  server.oauth = new Oauth2Server({
    model,
    grants: config.grants,
  });
}
