module.exports = callbackErrorHandler;

function callbackErrorHandler(res, callback) {
  return (err, result) => {
    if (err) {
      res.sendStatus(503);
    } else {
      callback(result);
    }
  }
}
