module.exports = oauthController;

function oauthController(server) {
  server.post('/api/oauth/token', (req, res, next) => {
    req.body.grant_type = 'password';
    next();
  }, server.oauth.grant());
  server.post('/api/oauth/refresh_token', (req, res, next) => {
    req.body.grant_type = 'refresh_token';
    next();
  }, server.oauth.grant());
}
