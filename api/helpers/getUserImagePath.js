const path = require('path');

module.exports = getUserImagePath;

function getUserImagePath(userId, file) {
  const time = (new Date()).getTime();
  const ext = path.extname(file.originalname);

  return `${userId}/${time}${ext}`;
}
