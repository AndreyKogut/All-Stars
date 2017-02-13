const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const usersSchema = new Schema({
  email: String,
  password: String,
  username: String,
  auth: {
    accessTokens: [],
    refreshTokens: [],
  },
});

const Users = mongoose.model('users', usersSchema);

module.exports = Users;
