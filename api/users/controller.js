const _ = require('lodash');
const validation = require('../helpers/validation');
const errorHandler = require('../helpers/callbackErrorHandler');
const Users = require('../users/model');

module.exports = usersController;

function usersController(server) {
  server.post('/api/join', (req, res) => {
    const where = {
      $or: [ {
        email: req.body.email,
      },{
        username: req.body.username,
      }]
    };
    const requestDataStructure = {
      email: {
        notEmpty: true,
        isEmail: true,
        errorMessage: 'Invalid email',
      },
      password: {
        notEmpty: true,
        errorMessage: 'Invalid password',
      },
      username: {
        notEmpty: true,
        errorMessage: 'Invalid name',
      },
    };

    validation(req, res, requestDataStructure, create);

    function create() {
      Users.findOne(where, errorHandler(res, getUser));
    }

    function getUser(user) {
      if (user) {
        if (user.email === req.body.email) {
          res.status(403).send('Email already exist');
        } else {
          res.status(403).send('Username already exist');
        }
      } else {
        const requestUser = Users(req.body);

        requestUser.save((err) => {
          if (err) res.sendStatus(503);

          res.sendStatus(200);
        });
      }
    }
  });

  server.post('/api/profile', server.oauth.authorise(), (req, res) => {
    const requestDataStructure = {
      username: {
        optional: true,
        notEmpty: true,
        errorMessage: 'Invalid name',
      },
      about: {
        optional: true,
      },
      avatar: {
        optional: true,
        errorMessage: 'Invalid avatar'
      },
    };

    validation(req, res, requestDataStructure, update);

    function update() {
      // pick to prevent updating protected fields
      const updateData = _.pick(req.body, [ 'username', 'about', 'avatar' ]);
      const where = { _id: req.user._id };
      const doc = { $set: updateData };

      Users.findOneAndUpdate(where, doc, errorHandler(res, success));
    }

    function success() {
      res.sendStatus(200);
    }
  });

  server.put('/api/users/:id', server.oauth.authorise(), (req, res) => {
    const profileId = req.user._id;
    const requestUserId = req.params.id;
    const requestDataStructure = {
      id: {
        notEmpty: true,
        isLength: {
          options: [ 24 ],
        },
        errorMessage: 'Invalid id',
      }
    };

    validation(req, res, requestDataStructure, subscribe);

    function subscribe() {
      const where = {
        _id: profileId,
        subscriptions: {
          $ne: requestUserId
        },
      };
      const doc = { $push: { subscriptions: requestUserId } };

      Users.findOneAndUpdate(where, doc, errorHandler(res, userUpdate));
    }

    function userUpdate() {
      res.sendStatus(200);
    }
  });

  server.put('/api/interests', server.oauth.authorise(), (req, res) => {
    const userId = req.user._id;
    const where = {
      _id: userId,
    };
    const doc = {
      interests: _
      .chain(req.body.interests)
      .map(item => item.toLowerCase())
      .uniq(req.body.interests),
    };

    const requestDataStructure = {
      interests: {
        notEmpty: true,
        isArray: true,
        interestsLimit: {
          errorMessage: 'Invalid interests count',
        },
        errorMessage: 'Invalid interests',
      },
    };

    validation(req, res, requestDataStructure, putInterests);

    function putInterests() {
      Users.findOneAndUpdate(where, doc, errorHandler(res, success));
    }

    function success() {
      res.sendStatus(200);
    }
  });

  server.delete('/api/profile', server.oauth.authorise(), (req, res) => {
    const where = { _id: req.user._id };

    Users.remove(where, errorHandler(res, success));

    function success() {
      res.sendStatus(200);
    }
  });

  server.delete('/api/users/:id', server.oauth.authorise(), (req, res) => {
    const profileId = req.user._id;
    const requestUserId = req.params.id;

    const where = {
      _id: profileId,
      subscriptions: requestUserId,
    };
    const doc = { $pull: { subscriptions: requestUserId } };

    Users.findOneAndUpdate(where, doc, errorHandler(res, removed));

    function removed() {
      res.sendStatus(200);
    }
  });

  server.delete('/api/interests/:name', server.oauth.authorise(), (req, res) => {
    const userId = req.user._id;
    const where = {
      _id: userId,
    };
    const doc = {
      $pull: {
        interests: req.params.name,
      },
    };

    Users.findOneAndUpdate(where, doc, errorHandler(res, success));

    function success() {
      res.sendStatus(200);
    }
  });

  server.get('/api/login', server.oauth.authorise(), (req, res) => {
    const where = { _id: req.user._id };
    const options = { __v: 0, password: 0, auth: 0 };

    Users.findOne(where, options, errorHandler(res, getUser));

    function getUser(user) {
      res.send(user);
    }
  });

  server.get('/api/profile', server.oauth.authorise(), (req, res) => {
    const userId = req.user._id;
    const where = { _id: userId };
    const options = { auth: 0, password: 0, __v: 0 };

    Users.findOne(where, options, errorHandler(res, getUser));

    function getUser(user) {
      res.send(user);
    }
  });

  server.get('/api/users', server.oauth.authorise(), (req, res) => {
    const where = { _id: { $ne: req.user._id } };
    const options = { auth: 0, password: 0, __v: 0 };

    Users.find(where, options, errorHandler(res, getUsers));

    function getUsers(users) {
      res.send(users);
    }
  });

  server.get('/api/users/:id', server.oauth.authorise(), (req, res) => {
    const options = { auth: 0, password: 0, __v: 0 };

    Users.findOne({}, options, errorHandler(res, getProfile));

    function getProfile(user) {
      const transform = _.assignWith(user.toJSON(), {
        isOwner: _.isEqual(user._id, req.user._id),
      });

      res.send(transform);
    }
  });

  server.get('/api/subscriptions', server.oauth.authorise(), (req, res) => {
    const where = { _id: req.user._id };
    const options = { subscriptions: 1 };

    Users.findOne(where, options, errorHandler(res, getSubscribers));

    function getSubscribers(user) {
      const subscribers = user.subscriptions;

      if (!subscribers.length) {
        res.send([]);
      } else {
        const where = { _id: { $in: subscribers } };
        const options = { auth: 0, password: 0 };
        Users.find(where, options, errorHandler(res, getUsers));
      }
    }

    function getUsers(users) {
      res.send(users);
    }
  });
}
