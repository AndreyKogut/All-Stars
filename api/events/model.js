const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const eventsSchema = new Schema({
  creator: String,
  name: String,
  description: String,
  image: String,
  date: String,
  participants: Array,
});

const Events = mongoose.model('events', eventsSchema);

module.exports = Events;
