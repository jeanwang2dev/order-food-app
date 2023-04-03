const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const administratorSchema = new Schema(
  {
    name: {
        type: String,
        require: false
    },
    email: {
        type: String,
        require: true
    }
  },
  {
    timestamps: true
  }

);

module.exports = mongoose.model('Administrator', administratorSchema);