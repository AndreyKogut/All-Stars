const ASError = require('./Error');

module.exports = validation;

function validation(req, requestDataStructure, callback, next) {
  req.check(requestDataStructure);

  req.getValidationResult().then((result) => {
    if (result.isEmpty()) {
      callback();
    } else  {
      const message = result.array()[0].msg;
      next(new ASError(400, message));
    }
  });
}
