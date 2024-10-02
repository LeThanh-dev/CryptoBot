const mongoose = require('../mongo');

const groupSchema = new mongoose.Schema({
  name: String,
  note: String,
  member: [{
    userID: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User'
    },
    isAdmin: {
      type: Boolean,
    }
  }],
  userID: {
    type: mongoose.Types.ObjectId,
    ref: 'User',
  },
});


const Group = mongoose.model('Group', groupSchema);

module.exports = Group;
