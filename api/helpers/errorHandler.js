const ASError = require('./Error');

module.exports = errorHandler;

function errorHandler(err, req, res, next) {
  if (err instanceof ASError) {
    res.status(err.code).send(err.message);
  } else {
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      res.status(403).send('Invalid files count');
    } else {
      res.status(500).send(err.message);
    }
  }
}
