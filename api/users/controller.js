const _ = require('lodash');
const validation = require('../helpers/validation');
const errorHandler = require('../helpers/callbackErrorHandler');
const imagesMethods = require('../images/methods');
const Users = require('../users/model');
const Stories = require('../stories/model');
const Events = require('../events/model');
const ASError = require('../helpers/Error');

module.exports = usersController;

function usersController(server) {
  server.post('/api/join', (req, res, next) => {
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

    validation(req, requestDataStructure, create);

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
          next(new ASError(403, 'Email already exist'));
        } else {
          next(new ASError(403, 'Username already exist'));
        }
      } else {
        const userData = _.pick(req.body, ['email', 'password', 'username']);
        const requestUser = Users(userData);

        requestUser.save(errorHandler(res, () => {
          req.body.grant_type = 'password';
          next();
        }));
      }
    }
  }, server.oauth.grant());

  server.post('/api/profile', server.oauth.authorise(), (req, res, next) => {
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
        errorMessage: 'Invalid avatar',
      },
    };

    validation(req, requestDataStructure, update);

    function update() {
      const whereUsername = { username: req.body.username };

      Users.findOne(whereUsername, errorHandler(res, findUser));
    }

    function findUser(user) {
      if (user) {
        next(new ASError(403, 'Username already exist'));
      } else {
        const updateData = _.pick(req.body, ['username', 'about', 'avatar']);
        const where = { _id: req.user._id };
        const doc = { $set: updateData };

        Users.findOneAndUpdate(where, doc, errorHandler(res));
      }
    }
  });

  server.put('/api/users/:id/subscriptions', server.oauth.authorise(), (req, res) => {
    const requestDataStructure = {
      id: {
        notEmpty: true,
        isValidId: true,
        errorMessage: 'Invalid id',
      },
    };

    validation(req, requestDataStructure, subscribe);

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

    validation(req, requestDataStructure, putInterests);

    const where = {
      _id: req.user._id,
    };
    const doc = {
      interests: _
        .chain(req.body.interests)
        .map(item => item.toLowerCase())
        .uniq()
        .value(),
    };

    function putInterests() {
      Users.findOneAndUpdate(where, doc, errorHandler(res));
    }
  });

  server.delete('/api/profile', server.oauth.authorise(), (req, res) => {
    const where = { _id: req.user._id };

    Users.remove(where, errorHandler(res, removeImages));

    function removeImages(user) {
      imagesMethods.removeUserImages(user._id);
      res.sendStatus(200);
    }
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

  server.get('/api/profile', server.oauth.authorise(), (req, res) => {
    const userId = req.user._id;
    const where = { _id: userId };
    const options = { auth: 0, password: 0, __v: 0 };

    Users.findOne(where, options, errorHandler(res, getUser));

    function getUser(user) {
      res.send(user);
    }
  });

  server.get('/api/users', server.oauth.authorise(), (req, res, next) => {
    const requestDataStructure = {
      skip: {
        notEmpty: true,
        isInt: true,
        isPositiveNumber: true,
        errorMessage: 'Invalid skip query',
      },
      count: {
        notEmpty: true,
        isInt: true,
        isPositiveNumber: true,
        errorMessage: 'Invalid count query',
      },
      name: {
        optional: true,
      },
      interests: {
        optional: true,
        isArray: true,
        errorMessage: 'Invalid interests',
      },
    };

    validation(req, requestDataStructure, findUsers, next);

    function findUsers() {
      const interests = req.query.interests;
      const name = req.query.name;
      const where = {
        _id: {
          $ne: req.user._id,
        },
      };
      if (name) {
        where.username = {
          $regex: `.*${name}.*`,
        };
      }
      if (interests) {
        where.interests = {
          $in: interests,
        };
      }
      const options = { auth: 0, password: 0, __v: 0 };

      Users
        .find(where, options, errorHandler(res, getUsers))
        .skip(Number(req.query.skip))
        .limit(Number(req.query.count));
    }

    function getUsers(users) {
      res.send(users);
    }
  });

  server.get('/api/users/:id', server.oauth.authorise(), (req, res) => {
    const options = { auth: 0, password: 0, __v: 0 };

    Users.findOne({ _id: req.params.id }, options, errorHandler(res, getProfile));

    function getProfile(user) {
      const transform = _.assignWith(user.toJSON(), {
        isOwner: _.isEqual(user._id, req.user._id),
      });

      res.send(transform);
    }
  });

  server.get('/api/profile/subscriptions', server.oauth.authorise(), (req, res, next) => {
    const requestDataStructure = {
      skip: {
        notEmpty: true,
        isInt: true,
        isPositiveNumber: true,
        errorMessage: 'Invalid skip query',
      },
      count: {
        notEmpty: true,
        isInt: true,
        isPositiveNumber: true,
        errorMessage: 'Invalid count query',
      },
    };

    validation(req, requestDataStructure, getSubscriptions, next);

    function getSubscriptions() {
      const where = { _id: req.user._id };
      const options = { subscriptions: 1 };

      Users.findOne(where, options, errorHandler(res, getSubscribers));
    }

    function getSubscribers(user) {
      const subscribers = user.subscriptions;

      if (!subscribers.length) {
        res.send([]);
      } else {
        const where = { _id: { $in: subscribers } };
        const options = { auth: 0, password: 0 };

        Users
          .find(where, options, errorHandler(res, getUsers))
          .skip(Number(req.query.skip))
          .limit(Number(req.query.count));
      }
    }

    function getUsers(users) {
      res.send(users);
    }
  });

  server.get('/api/stories/:id/likes', server.oauth.authorise(), (req, res, next) => {
    const requestDataStructure = {
      skip: {
        notEmpty: true,
        isInt: true,
        isPositiveNumber: true,
        errorMessage: 'Invalid skip query',
      },
      count: {
        notEmpty: true,
        isInt: true,
        isPositiveNumber: true,
        errorMessage: 'Invalid count query',
      },
    };

    validation(req, requestDataStructure, getStory, next);

    function getStory() {
      const where = { _id: req.params.id };
      const options = { likes: 1 };

      Stories.findOne(where, options, errorHandler(res, findUsers));
    }

    function findUsers(story) {
      if (story) {
        const usersWhere = { _id: { $in: story.likes } };
        const usersOptions = { password: 0, auth: 0, __v: 0 };
        Users
          .find(usersWhere, usersOptions, errorHandler(res, getUsers))
          .skip(Number(req.query.skip))
          .limit(Number(req.query.count));
      } else {
        res.send([]);
      }
    }

    function getUsers(users) {
      res.send(users);
    }
  });

  server.get('/api/events/:id/participants', server.oauth.authorise(), (req, res, next) => {
    const requestDataStructure = {
      skip: {
        notEmpty: true,
        isInt: true,
        isPositiveNumber: true,
        errorMessage: 'Invalid skip query',
      },
      count: {
        notEmpty: true,
        isInt: true,
        isPositiveNumber: true,
        errorMessage: 'Invalid count query',
      },
    };

    validation(req, requestDataStructure, getEvent, next);

    function getEvent() {
      const where = { _id: req.params.id };
      const options = { participants: 1 };

      Events.findOne(where, options, errorHandler(res, findUsers));
    }

    function findUsers(event) {
      if (event) {
        const usersWhere = { _id: { $in: event.participants } };
        const usersOptions = { password: 0, auth: 0, __v: 0 };
        Users
          .find(usersWhere, usersOptions, errorHandler(res, getUsers))
          .skip(Number(req.query.skip))
          .limit(Number(req.query.count));
      } else {
        res.send([]);
      }
    }

    function getUsers(users) {
      res.send(users);
    }
  });
}
