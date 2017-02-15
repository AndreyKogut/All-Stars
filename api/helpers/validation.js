module.exports = validation;

function validation(req, res, requestDataStructure, callback) {
  req.check(requestDataStructure);

  req.getValidationResult().then(function (result) {
    if (result.isEmpty()) {
      callback();
    } else  {
      const error = result.array()[0].msg;
      res.status(400).send(error);
    }
  });
}
