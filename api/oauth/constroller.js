module.exports = oauthController;

function oauthController(server) {
  server.all('/api/oauth/token', server.oauth.grant());

  server.use(server.oauth.errorHandler());

  //server.get('/api/public', server.oauth.bypass, function (req, res) {
}
