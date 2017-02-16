const _ = require('lodash');
const validation = require('../helpers/validation');
const errorHandler = require('../helpers/callbackErrorHandler');
const Users = require('../users/model');
const Stories = require('../stories/model');
const Events = require('../events/model');

module.exports = usersController;

function usersController(server) {
  server.post('/api/join', (req, res) => {
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
      const where = {
        $or: [{
          email: req.body.email,
        },{
          username: req.body.username,
        }]
      };

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
        const userData = _.pick(req.body, ['email', 'password', 'username']);
        const requestUser = Users(userData);

        requestUser.save(errorHandler(res));
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
      const whereUsername = { username: req.body.username };

      Users.findOne(whereUsername, errorHandler(res, findUser));
    }

    function findUser(user) {
      if (!user) {
        const updateData = _.pick(req.body, ['username', 'about', 'avatar']);
        const where = { _id: req.user._id };
        const doc = { $set: updateData };

        Users.findOneAndUpdate(where, doc, errorHandler(res));
      } else {
        res.status(403).send('Username already exist');
      }
    }
  });

  server.put('/api/users/:id/subscriptions', server.oauth.authorise(), (req, res) => {
    const requestDataStructure = {
      id: {
        notEmpty: true,
        isLength: {
          options: [24],
        },
        errorMessage: 'Invalid id',
      }
    };

    validation(req, res, requestDataStructure, subscribe);

    function subscribe() {
      const requestUserId = req.params.id;
      const where = {
        _id: req.user._id,
        subscriptions: {
          $ne: requestUserId,
        },
      };
      const doc = { $push: { subscriptions: requestUserId } };

      Users.findOneAndUpdate(where, doc, errorHandler(res));
    }
  });

  server.put('/api/interests', server.oauth.authorise(), (req, res) => {
    const where = {
      _id: req.user._id,
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
      Users.findOneAndUpdate(where, doc, errorHandler(res));
    }
  });

  server.delete('/api/profile', server.oauth.authorise(), (req, res) => {
    const where = { _id: req.user._id };

    Users.remove(where, errorHandler(res));
  });

  server.delete('/api/users/:id/subscriptions', server.oauth.authorise(), (req, res) => {
    const requestUser = req.params.id;
    const where = {
      _id: req.user._id,
    };
    const doc = { $pull: { subscriptions: requestUser } };

    Users.findOneAndUpdate(where, doc, errorHandler(res));
  });

  server.delete('/api/interests/:name', server.oauth.authorise(), (req, res) => {
    const where = { _id: req.user._id };
    const doc = {
      $pull: {
        interests: req.params.name,
      },
    };

    Users.findOneAndUpdate(where, doc, errorHandler(res));
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

  server.get('/api/stories/:id/likes', server.oauth.authorise(), (req, res) => {
    const where = { _id: req.params.id };
    const options = { likes: 1 };

    Stories.findOne(where, options, errorHandler(res, findUsers));

    function findUsers(story) {
      if (story) {
        const usersWhere = { _id: { $in: story.likes } };
        const usersOptions = { password: 0, auth: 0, __v: 0 };
        Users.find(usersWhere, usersOptions, errorHandler(res, getUsers));
      } else {
        res.send([]);
      }
    }

    function getUsers(users) {
      res.send(users);
    }
  });

  server.get('/api/events/:id/participants', server.oauth.authorise(), (req, res) => {
    const where = { _id: req.params.id };
    const options = { participants: 1 };

    Events.findOne(where, options, errorHandler(res, findUsers));

    function findUsers(event) {
      if (event) {
        const usersWhere = { _id: { $in: event.participants } };
        const usersOptions = { password: 0, auth: 0, __v: 0 };
        Users.find(usersWhere, usersOptions, errorHandler(res, getUsers));
      } else {
        res.send([]);
      }
    }

    function getUsers(users) {
      res.send(users);
    }
  });
}
