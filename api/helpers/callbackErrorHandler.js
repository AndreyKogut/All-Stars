module.exports = callbackErrorHandler;

function callbackErrorHandler(res, callback) {
  return (err, result) => {
    if (err) {
      res.sendStatus(503);
    } else {
      if (!callback) {
        res.sendStatus(200);
      } else {
        callback(result);
      }
    }
  }
}
