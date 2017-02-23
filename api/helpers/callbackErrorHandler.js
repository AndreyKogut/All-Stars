module.exports = callbackErrorHandler;

function callbackErrorHandler(res, callback) {
  return (err, result) => {
    if (err) {
      res.status(503).send('DB error');
    } else {
      if (!callback) {
        res.sendStatus(200);
      } else {
        callback(result);
      }
    }
  }
}
