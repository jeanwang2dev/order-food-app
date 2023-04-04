const { v4: uuidv4 } = require('uuid');

const Product = require("../models/product");
const Order = require("../models/order");
const Guest = require('../models/guest');

exports.getHome = (req, res, next) => {
  Product.find({ isfeatured: true })
    .then((products) => {
      res.render("shop", {
        prods: products,
        pageTitle: "Shop Home",
        path: "/",
        isAuthenticated: req.session.isCustomerLoggedIn,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getProducts = (req, res, next) => {
  Product.find()
    .then((products) => {
      res.render("shop/product-list", {
        prods: products,
        pageTitle: "Shop Products",
        path: "/",
        isAuthenticated: req.session.isCustomerLoggedIn,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productID;
  Product.findById(prodId)
    .then((product) => {
      res.render("shop/product-detail", {
        product: product,
        pageTitle: "Product Detail",
        path: "/products",
        isAuthenticated: req.session.isCustomerLoggedIn,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getCart = async (req, res, next) => {
  // get Cart page for guest
  if(req.session.isGuestLoggedIn){
    try {
      const guest = await req.guest.populate("cart.items.productId");
      const products = guest.cart.items;
      res.render("shop/cart", {
        pageTitle: "Your Cart",
        path: "/cart",
        products: products,
        userName: 'Anonymous',
        isAuthenticated: req.session.isCustomerLoggedIn,
      });
    } catch (err) {
      console.log(err);
    }
  }

  // get Cart page for customer
  if(req.session.isCustomerLoggedIn){
    try {
      const customer = await req.customer.populate("cart.items.productId");
      const products = customer.cart.items;
      const userName = customer.name;
      res.render("shop/cart", {
        pageTitle: "Your Cart",
        path: "/cart",
        products: products,
        userName: userName,
        isAuthenticated: req.session.isCustomerLoggedIn,
      });
    } catch (err) {
      console.log(err);
    }
  }

};

exports.postCart = async (req, res, next) => {

  const prodId = req.body.productId;
    
  // for guest
  if( !req.session.isCustomerLoggedIn) {
    console.log('this is a guest!');
    //create a session for guest
    req.session.isGuestLoggedIn = true;
    const guestUID = req.cookies[`guestUID`];
    const guest = await Guest.findOne({ uid: req.cookies[`guestUID`] });
    if( guestUID === undefined || !guest){
      console.log('this is a new guest without uid or no uid matches in db.');
      // new guest withou uid, set cookie guestUID
      const uuid = uuidv4();
      res.cookie(`guestUID`, uuid);
      // create an empty cart for the new guest and store it with uuid in db
      const guest = new Guest({
        uid: uuid,
        cart: { items: []},
      });
      await guest.save();
      // get product by product ID and add to guest cart
      const product = await Product.findById(prodId);
      await guest.addToCart(product);
      req.session.guest = guest;
      res.redirect("/cart");
    } else {
      console.log('this is an old guest came back');      
      console.log('guestUID:', req.cookies[`guestUID`]);
      // look for this guest in db and get its cart infomation
      const product = await Product.findById(prodId);
      await guest.addToCart(product);
      req.session.guest = guest;
      res.redirect("/cart");
    } 

  } else { // for customer
    Product.findById(prodId)
      .then((product) => {
        return req.customer.addToCart(product);
      })
      .then((result) => {
        res.redirect("/cart");
      })
      .catch((err) => {
        console.log(err);
      });
  }

};

exports.postDeleteCartProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.customer
    .removeFromCart(prodId)
    .then((result) => {
      res.redirect("/cart");
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.postOrder = async (req, res, next) => {
  try {
    const customer = await req.customer.populate(
      "cart.items.productId"
    );
    const products = customer.cart.items.map((i) => {
      return { quantity: i.quantity, product: { ...i.productId._doc } };
    });

    const order = new Order({
      customer: {
        email: req.customer.email,
        customerId: req.customer,
      },
      products: products,
    });
    //const savedOrder = await order.save();
    //const orderID = savedOrder._id;
    // created an invoice pdf with the OrderID and upload to GCS
    // const pdfUrl = await generatePDFonGCS(orderID);
    // savedOrder.invoiceUrl = pdfUrl;
    // return the url and save in order collection
    //await savedOrder.save();
    await order.save();
    await req.customer.clearCart();
    res.redirect("/orders");
  } catch (err) {
    console.log(err);
    // const error = new Error(err);
    // error.httpStatusCode = 500;
    // return next(error);
  }
};

exports.getOrders = (req, res, next) => {
  let customerName = req.customer.name;
  Order.find({ "customer.customerId": req.customer._id })
    .then((orders) => {
      res.render("shop/orders", {
        pageTitle: "Orders",
        path: "/orders",
        orders: orders,
        name: customerName,
        isAuthenticated: req.session.isCustomerLoggedIn,
      });
    })
    .catch((err) => {
      console.log(err);
      // const error = new Error(err);
      // error.httpStatusCode = 500;
      // return next(error);
    });
};
