const path = require('path');
const _ = require('lodash');
const ASError = require('../helpers/Error');

module.exports = validate;

function validate(files, callback) {
  const validSize = 1024 * 1024 * 3;
  const validMimes = ['image/jpeg'];
  const validExts = ['.jpeg', '.jpg'];

  if (!files || !files.length) throw new ASError(400, 'Files list is empty');

  _.each(files, (file) => {
    const size = file.size;
    const ext = path.extname(file.originalname);
    const mime = file.mimetype;

    if (size > validSize) {
      throw new ASError(400, 'Invalid file size');
    }

    if (!(_.indexOf(validMimes, mime) + 1)
      || !(_.indexOf(validExts, ext) + 1)) {
      throw new ASError(400, 'Invalid image type');
    }
  });

  callback();
}
