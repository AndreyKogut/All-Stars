const Users = require('../users/model');

module.exports = usersController;

function usersController(server) {
  server.post('/api/join', function (req, res) {
    const requestDataStructure = {
      email: {
        notEmpty: true,
        isEmail: {
          errorMessage: 'Invalid Email'
        }
      },
      password: {
        notEmpty: true,
        errorMessage: 'Invalid pass',
      },
      username: {
        notEmpty: true,
        errorMessage: 'Invalid name',
      },
    };

    req.checkBody(requestDataStructure);

    req.getValidationResult().then(function(result) {
      if (result.isEmpty()) {
        Users.findOne({ email: req.body.email }, function (err, user) {
          if (user) {
            res.status(403).send('Email already exist');
          } else {
            const requestUser = Users(req.body);

            requestUser.save((err) => {
              if (err) res.sendStatus(503);

              res.sendStatus(200);
            });
          }
        });
      } else {
        const error = result.array()[0].msg;
        res.status(400).send(error);
      }
    });
  });
}
