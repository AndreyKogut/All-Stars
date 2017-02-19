const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const validator = require('express-validator');
const _ = require('lodash');
const webSocket = require('express-ws');
const ObjectId = require('mongoose').Types.ObjectId;
const config = require('./config');
const routes = require('./api/routes');

const app = express();
app.wsInstance = webSocket(app);

app.use(validator());
app.use('/', express.static(`${__dirname}/client/app`));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(validator({
  customValidators: {
    isArray: (value) => _.isArray(value),
    interestsLimit: (value) => value.length <= 10,
    isValidId: (value) => ObjectId.isValid(value),
  },
}));

mongoose.connect(config.getConnectionString());

config.oauthConfig(app);
routes(app);

app.use(app.oauth.errorHandler());

// basic error handler for not auth errors
app.use(function (err, req, res, next) {
  console.log(err);
  res.status(403).send('Invalid data type');
});

app.listen(3000);
