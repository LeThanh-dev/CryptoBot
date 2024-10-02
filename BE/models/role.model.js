const mongoose = require('../mongo');

const roleSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true,
  },
  roleList: [String],
});


const Role = mongoose.model('Role', roleSchema);
// Role.createIndexes(); 

module.exports = Role;
