const mongoose = require('../mongo');

const userSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  roleName: String,
  isActive: Boolean,
  groupID: {
    type: mongoose.Types.ObjectId,
    ref: 'Group',
  },
  // botTypeIDList: [{
  //   type: mongoose.Schema.Types.ObjectId,
  //   ref: 'BotType'
  // }],
});


const User = mongoose.model('User', userSchema);
// User.createIndexes();

module.exports = User;
