const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const chatsSchema = new Schema({
  owner: String,
  enabled: Boolean,
  messages: {
    _id: String,
    creator: String,
    text: String,
    date: String,
  },
});

const Chats = mongoose.model('chats', chatsSchema);

module.exports = Chats;
