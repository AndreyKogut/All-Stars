const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const chatsSchema = new Schema({
  owner: String,
  theme: String,
  enabled: Boolean,
  blacklist: Array,
  messages: [{
    creator: String,
    text: String,
    date: String,
  }],
});

const Chats = mongoose.model('chats', chatsSchema);

module.exports = Chats;
