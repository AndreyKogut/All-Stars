module.exports = {
  filesSize,
};

function filesSize(res, files, callback) {
  files.forEach((file) => {
    if (file.size > 1024 * 1024 * 3) {
      res.status(400).send('Invalid file size');
    }

    return false;
  });

  callback();
}
