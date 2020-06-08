const mongoose = require('mongoose');

const AppDataSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  surname: {
    type: String,
    required: true
  },
  type: {
      type: String,
      required: true
  }
});

const User = mongoose.model('AppData', AppDataSchema);
module.exports = User;
