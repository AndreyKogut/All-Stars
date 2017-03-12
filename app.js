const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const validator = require('express-validator');
const webSocket = require('express-ws');

const customValidators = require('./api/helpers/validators.js');
const config = require('./config');
const routes = require('./api/routes');
const errorHandler = require('./api/helpers/errorHandler');

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

routes(app);

app.listen(port);
