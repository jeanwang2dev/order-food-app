const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const productSchema = new Schema({
    title: {
        type: String,
        require: true
    },
    isfeatured: {
        type: Boolean,
        require: false
    }
});

module.exports = mongoose.model('Product', productSchema);