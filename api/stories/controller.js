const _ = require('lodash');
const Stories = require('./model');
const validation = require('../helpers/validation');
const errorHandler = require('../helpers/callbackErrorHandler');
const ASError = require('../helpers/Error');

module.exports = storiesController;

function storiesController(server) {
  server.post('/api/stories', server.oauth.authorise(), (req, res) => {
    const requestDataStructure = {
      name: {
        optional: true,
        notEmpty: true,
        errorMessage: 'Invalid name',
      },
      text: {
        notEmpty: true,
        isLength: {
          options: [{ max: 500 }],
        },
        errorMessage: 'Invalid text',
      },
      image: {
        optional: true,
        notEmpty: true,
        errorMessage: 'Invalid image',
      },
    };

    validation(req, requestDataStructure, create);

    function create() {
      const requestData = _.pick(req.body, ['name', 'text', 'image']);
      const storyInfo = {
        creator: req.user._id,
        date: new Date(),
      };
      const newStory = Stories(_.assign(storyInfo, requestData));

      newStory.save(errorHandler(res, getId));
    }

    function getId(story) {
      res.send(story._id);
    }
  });

  server.post('/api/stories/:id', server.oauth.authorise(), (req, res, next) => {
    const requestDataStructure = {
      name: {
        optional: true,
        notEmpty: true,
        errorMessage: 'Invalid name',
      },
      text: {
        optional: true,
        notEmpty: true,
        isLength: {
          options: [{ max: 500 }],
        },
        errorMessage: 'Invalid text',
      },
      image: {
        optional: true,
        notEmpty: true,
        errorMessage: 'Invalid image',
      },
    };

    const where = {
      _id: req.params.id,
      creator: req.user._id,
    };
    const doc = {
      $set: _.pick(req.body, ['name', 'text', 'image']),
    };

    validation(req, requestDataStructure, update);

    function update() {
      Stories.findOneAndUpdate(where, doc, errorHandler(res, handleUpdate));
    }

    function handleUpdate(story) {
      if (story) {
        res.sendStatus(200);
      } else {
        next(new ASError(403, 'Not creator'));
      }
    }
  });

  server.put('/api/stories/:id/likes', server.oauth.authorise(), (req, res) => {
    const userId = req.user._id;
    const where = {
      _id: req.params.id,
      likes: {
        $ne: userId,
      },
    };
    const doc = {
      $push: {
        likes: userId,
      },
    };

    Stories.findOneAndUpdate(where, doc, errorHandler(res));
  });

  server.delete('/api/stories/:id/likes', server.oauth.authorise(), (req, res) => {
    const where = {
      _id: req.params.id,
    };
    const doc = {
      $pull: {
        likes: req.user._id,
      },
    };

    Stories.findOneAndUpdate(where, doc, errorHandler(res));
  });

  server.delete('/api/stories/:id', server.oauth.authorise(), (req, res) => {
    const where = {
      _id: req.params.id,
      creator: req.user._id,
    };

    Stories.remove(where, errorHandler(res));
  });

  server.delete('/api/profile/stories', server.oauth.authorise(), (req, res) => {
    const where = { creator: req.user._id };

    Stories.remove(where, errorHandler(res));
  });

  server.get('/api/users/:id/stories', server.oauth.authorise(), (req, res, next) => {
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

    validation(req, requestDataStructure, findStories, next);

    function findStories() {
      const where = { creator: req.params.id };

      Stories
        .find(where, errorHandler(res, getStories))
        .skip(Number(req.query.skip))
        .limit(Number(req.query.count));
    }

    function getStories(stories) {
      res.send(stories);
    }
  });

  server.get('/api/profile/stories', server.oauth.authorise(), (req, res, next) => {
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

    validation(req, requestDataStructure, findStories, next);

    function findStories() {
      const where = { creator: req.user._id };

      Stories
        .find(where, errorHandler(res, getStories))
        .skip(Number(req.query.skip))
        .limit(Number(req.query.count));
    }

    function getStories(stories) {
      res.send(stories);
    }
  });

  server.get('/api/stories/:id', server.oauth.authorise(), (req, res) => {
    const where = { _id: req.params.id };

    Stories.findOne(where, errorHandler(res, getStory));

    function getStory(story) {
      res.send(story);
    }
  });
}
