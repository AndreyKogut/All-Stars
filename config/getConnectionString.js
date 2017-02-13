const config = require('./settings.json');

module.exports = getConnectionString;

function getConnectionString() {
  return `mongodb://${config.username}:${config.password}@ds023902.mlab.com:23902/all-stars`;
}
