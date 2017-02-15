module.exports = oauthController;

function oauthController(server) {
  server.post('/api/oauth/token', server.oauth.grant());
  server.post('/api/oauth/refresh_token', server.oauth.grant());
}
