const fs = require('fs');
const multer  = require('multer');
const _ = require('lodash');
const Images = require('./model');
const ASError = require('../helpers/Error');
const methods = require('./methods');
const validateFiles = require('./validate');
const validate = require('../helpers/validation');
const errorHandler = require('../helpers/callbackErrorHandler');
const getUserImagePath = require('../helpers/getUserImagePath');
const uploads = multer({ storage: multer.memoryStorage() });

const uploadFields = uploads.fields([
  { name: 'avatar', maxCount: 1 },
  { name: 'story', maxCount: 1 },
  { name: 'gallery', maxCount: 8 },
]);

module.exports = imagesController;

function imagesController(server) {
  server.post('/api/profile/images', server.oauth.authorise(), uploadFields,
    (req, res) => {
      const userId = req.user._id;
      const files = _
        .chain(req.files)
        .values()
        .reduce((sum, item) => _.concat(sum, item))
        .value();

      validateFiles(files, createDocuments);

      let imagesUrls = [];
      let filesToReturn = files.length;

      function createDocuments() {
        fs.mkdir(`./uploads/${userId}`, () => {
          _.each(files, (file) => {
            const imagePath = getUserImagePath(userId, file);

            const imageDocument = Images({
              creator: userId,
              url: imagePath,
              date: new Date(),
              type: file.fieldname,
            });

            imageDocument.save((err, image) => {
              if (err || !image) {
                filesToReturn -= 1;
              } else {
                saveFile(imagePath, file.buffer);
              }
            });
          });
        });
      }

      function saveFile(path, buffer) {
        fs.writeFile(`./uploads/${path}`, buffer, (err) => {
          if (err) {
            filesToReturn -= 1;
          } else {
            imagesUrls.push(path);
            resolve();
          }
        });
      }

      function resolve() {
        if (imagesUrls.length >= filesToReturn) {
          res.send(imagesUrls);
        }
      }
    });

  server.get('/api/profile/images', server.oauth.authorise(), (req, res) => {
    const where = {
      creator: req.user._id,
    };

    Images.find(where, errorHandler(res, getImages));

    function getImages(images) {
      res.send(images);
    }
  });

  server.delete('/api/images/:id', server.oauth.authorise(), (req, res, next) => {
    const where = {
      _id: req.params.id,
      creator: req.user._id,
    };

    Images.findOne(where, errorHandler(res, removeFile));

    function removeFile(file) {
      if (!file) {
        next(new ASError(400, 'Document not found'));
      } else {
        methods.removeImage(file.url);
        Images.remove(where, errorHandler(res));
      }
    }
  });

  server.post('/api/images/:id', server.oauth.authorise(), (req, res, next) => {
    const requestDataStructure = {
      type: {
        isImageTypesArray: true,
        errorMessage: 'Invalid image type',
      }
    };

    validate(req, requestDataStructure, update, next);

    function update() {
      const where = {
        _id: req.params.id,
        creator: req.user._id,
      };
      const doc = {
        type: req.body.type,
      };

      Images.findOneAndUpdate(where, doc, errorHandler(res));
    }
  });

  server.get('/api/images/:id', server.oauth.authorise(), (req, res) => {
    const where = {
      _id: req.params.id,
    };

    Images.findOne(where, errorHandler(res, getImages));

    function getImages(images) {
      res.send(images);
    }
  });
}
