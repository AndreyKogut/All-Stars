const fs = require('fs');
const IMAGES_FOLDER = './uploads/';

module.exports = {
  removeImage,
  removeUserImages,
};

function removeImage(url) {
  fs.unlink(`${IMAGES_FOLDER}${url}`);
}

function removeUserImages(userId) {
  fs.rmdir(`${IMAGES_FOLDER}${userId}`);
}
