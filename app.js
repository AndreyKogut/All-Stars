const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const validator = require('express-validator');
const config = require('./config');
const routes = require('./api/routes');

const app = express();

app.use(validator());
app.use('/', express.static(`${__dirname}/client/app`));
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

mongoose.connect(config.getConnectionString());

config.oauthConfig(app);

routes(app);

app.listen(3000);
