const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const productSchema = new Schema({
    title: {
        type: String,
        require: true
    },
    price: {
        type: Number,
        require: true
    },
    description: {
        type: String,
        require: true
    },
    isfeatured: {
        type: Boolean,
        require: false
    },
    imageUrl: {
        type: String,
        require: false
    },
});

module.exports = mongoose.model('Product', productSchema);