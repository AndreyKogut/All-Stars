const _ = require('lodash');
const path = require('path');

module.exports = getUserImagePath;

function getUserImagePath(userId, file) {
  const time = (new Date()).getTime();
  const ext = path.extname(file.originalname);
  const randomInt = _.uniqueId();

  return `${userId}/${time}.${randomInt}${ext}`;
}
