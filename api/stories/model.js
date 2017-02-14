const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const storiesSchema = new Schema({
  creator: String,
  name: String,
  text: String,
  data: String,
  image: String,
  likes: Array,
});

const Stories = mongoose.model('stories', storiesSchema);

module.exports = Stories;
