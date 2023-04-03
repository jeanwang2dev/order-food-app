const mongoose = require('mongoose');

const Schema = mongoose.Schema;

const customerSchema = new Schema(
  {
    name: {
        type: String,
        require: false
    },
    email: {
        type: String,
        require: true
    },
    password: {
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

customerSchema.methods.addToCart = function(product) {
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

customerSchema.methods.removeFromCart = function(prodId) {
    const updatedCartItems = this.cart.items.filter((item) => {
      return item.productId.toString() !== prodId.toString();
    });    
    this.cart.items = updatedCartItems;
    return this.save();
}

customerSchema.methods.clearCart = function() {
  this.cart = { items: []};
  return this.save();
}

module.exports = mongoose.model('Customer', customerSchema);

