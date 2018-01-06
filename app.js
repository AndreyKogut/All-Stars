const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const validator = require('express-validator');
const webSocket = require('express-ws');

const customValidators = require('./api/helpers/validators.js');
const config = require('./config');
const routes = require('./api/routes');
const errorHandler = require('./api/helpers/errorHandler');

const allowCrossDomain = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', 'http://localhost:4200');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  next();
};

const port = process.env.PORT || 8080;
const app = express();
app.wsInstance = webSocket(app);

app.use(validator());
app.use('/', express.static(`${__dirname}/client/app`));
app.use(express.static('uploads'));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(validator({ customValidators }));

mongoose.connect(config.getConnectionString());
config.oauthConfig(app);

app.use(allowCrossDomain);
routes(app);

app.listen(port);
