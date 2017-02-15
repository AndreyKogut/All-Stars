const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const usersSchema = new Schema({
  email: String,
  password: String,
  username: String,
  about: String,
  interests: Array,
  avatar: String,
  subscriptions: Array,
  auth: {
    accessTokens: Array,
    refreshTokens: Array,
  },
});

const Users = mongoose.model('users', usersSchema);

module.exports = Users;
