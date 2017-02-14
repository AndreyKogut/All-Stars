const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const imageSchema = new Schema({
  creator: String,
  url: String,
  date: String,
});

const Images = mongoose.model('images', imageSchema);

module.exports = Images;
