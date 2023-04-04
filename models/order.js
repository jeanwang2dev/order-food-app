const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const orderSchema = new Schema(
    {
        products: [{
            product: { type: Object, require: true},
            quantity: { type: Number, require: true}
        }],
        customer: {
            email: {
                type: String,
                require: true
            },
            customerId: {
                type: Schema.Types.ObjectId,
                require: true,
                ref: 'Customer'
            }
        },
        invoiceUrl: {
            type: String,
            require: false
        }
    },
    {
        timestamps: true
    }
);

module.exports = mongoose.model('Order', orderSchema);