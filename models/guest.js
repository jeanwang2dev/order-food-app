const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const guestSchema = new Schema(
    {
        uid: {
            type: String,
            require: true
        },
        cart: {
            items: [{
                productId: {
                    type: Schema.Types.ObjectId, 
                    ref: 'Product',
                    require: true
                }, 
                quantity: { 
                    type: Number, 
                    require: true 
                }
            }]
        }
    },
    {
            timestamps: true
    }
        
);

guestSchema.methods.addToCart = function(product) {
    // if the product already exists in the cart
    const cartProductIndex = this.cart.items.findIndex((cp) => {
      return cp.productId.toString() === product._id.toString();
    });
    let newQuantity = 1;
    const updatedCartItems = [...this.cart.items];

    if (cartProductIndex >= 0) {
      console.log("already exist in the cart!");
      newQuantity = this.cart.items[cartProductIndex].quantity + 1;
      updatedCartItems[cartProductIndex].quantity = newQuantity;
    } else {
      updatedCartItems.push({
        productId: product._id,
        quantity: newQuantity,
      });
    }

    const updatedCart = {
      items: updatedCartItems,
    };
    this.cart = updatedCart;
    return this.save();
}

module.exports = mongoose.model('Guest', guestSchema);
