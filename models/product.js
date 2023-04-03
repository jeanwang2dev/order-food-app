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
        require: false
    },
    isfeatured: {
        type: Boolean,
        require: false
    },
    imageUrl: {
        type: String,
        require: true
    },
    adminId: {
        type: Schema.Types.ObjectId,
        ref: 'Administrator',
        require: true
    }
});

module.exports = mongoose.model('Product', productSchema);