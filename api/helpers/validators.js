const _ = require('lodash');
const ObjectId = require('mongoose').Types.ObjectId;
const imageTypes = ['gallery', 'avatar', 'story'];

module.exports = {
  isArray: value => _.isArray(value),
  isImageTypesArray: (value) => {
    if (!_.isArray(value)) {
      return false;
    }

    return !_
      .chain(value)
      .uniq()
      .some(item => !(_.indexOf(imageTypes, item) + 1))
      .value();
  },
  interestsLimit: value => value.length <= 10,
  isValidId: value => ObjectId.isValid(value),
};