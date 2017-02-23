const _ = require('lodash');
const Events = require('./model');
const validation = require('../helpers/validation');
const errorHandler = require('../helpers/callbackErrorHandler');
const ASError = require('../helpers/Error');

module.exports = eventsController;

function eventsController(server) {
  server.post('/api/events', server.oauth.authorise(), (req, res) => {
    const requestDataStructure = {
      name: {
        optional: true,
        notEmpty: true,
        errorMessage: 'Invalid name',
      },
      description: {
        notEmpty: true,
        isLength: {
          options: [{ max: 1000 }],
        },
        errorMessage: 'Invalid description',
      },
      image: {
        optional: true,
        notEmpty: true,
        errorMessage: 'Invalid image',
      },
    };

    validation(req, requestDataStructure, create);

    function create() {
      const requestData = _.pick(req.body, ['name', 'description', 'image']);
      const eventInfo = {
        creator: req.user._id,
        date: new Date(),
      };
      const newEvent = Events(_.assign(eventInfo, requestData));

      newEvent.save(errorHandler(res, getId));
    }

    function getId(event) {
      res.send(event._id);
    }
  });

  server.post('/api/events/:id', server.oauth.authorise(), (req, res, next) => {
    const requestDataStructure = {
      name: {
        optional: true,
        notEmpty: true,
        errorMessage: 'Invalid name',
      },
      description: {
        optional: true,
        notEmpty: true,
        isLength: {
          options: [{ max: 1000 }],
        },
        errorMessage: 'Invalid description',
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
      $set: _.pick(req.body, ['name', 'description', 'image']),
    };

    validation(req, requestDataStructure, update);

    function update() {
      Events.findOneAndUpdate(where, doc, errorHandler(res, handleUpdate));
    }

    function handleUpdate(event) {
      if (event) {
        res.sendStatus(200);
      } else {
        next(new ASError(403, 'Not creator'));
      }
    }
  });

  server.put('/api/events/:id/participants', server.oauth.authorise(), (req, res) => {
    const userId = req.user._id;
    const where = {
      _id: req.params.id,
      participants: {
        $ne: userId,
      },
    };
    const doc = {
      $push: {
        participants: userId,
      },
    };

    Events.findOneAndUpdate(where, doc, errorHandler(res));
  });

  server.delete('/api/events/:id/participants', server.oauth.authorise(), (req, res) => {
    const where = {
      _id: req.params.id,
    };
    const doc = {
      $pull: {
        participants: req.user._id,
      },
    };

    Events.findOneAndUpdate(where, doc, errorHandler(res));
  });

  server.delete('/api/events/:id', server.oauth.authorise(), (req, res) => {
    const where = {
      _id: req.params.id,
      creator: req.user._id,
    };

    Events.remove(where, errorHandler(res));
  });

  server.delete('/api/events', server.oauth.authorise(), (req, res) => {
    const where = { creator: req.user._id };

    Events.remove(where, errorHandler(res));
  });

  server.get('/api/events', server.oauth.authorise(), (req, res) => {
    const where = { creator: req.user._id };

    Events.find(where, errorHandler(res, getEvents));

    function getEvents(Events) {
      res.send(Events);
    }
  });

  server.get('/api/events/:id', server.oauth.authorise(), (req, res) => {
    const where = { _id: req.params.id };

    Events.findOne(where, errorHandler(res, getEvent));

    function getEvent(event) {
      res.send(event);
    }
  });
}
