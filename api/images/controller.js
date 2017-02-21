const fs = require('fs');
const multer  = require('multer');
const Users = require('../users/model');
const validateFile = require('./validate');
const errorHandler = require('../helpers/callbackErrorHandler');
const getUserImagePath = require('../helpers/getUserImagePath');

const uploads = multer({ storage: multer.memoryStorage() });

module.exports = imagesController;

function imagesController(server) {
  server.post('/api/profile/avatar', server.oauth.authorise(), uploads.single('avatar'),
    (req, res) => {
      const imagePath = getUserImagePath(req.user._id, req.file);

      validateFile.filesSize(res, [req.file], saveFile);

      function saveFile() {
        fs.writeFile(`./uploads/${imagePath}`, req.file.buffer, errorHandler(res, putAvatar));
      }

      function putAvatar() {
        const where = { _id: req.user._id };
        const doc = { avatar: imagePath };

        Users.findOneAndUpdate(where, doc, errorHandler(res));
      }
    });
}
