const path = require('path');
const fs = require('fs');
const PDFDocument = require("pdfkit");

const { secret_key }= require('../util/config');
const stripe = require('stripe')(secret_key);
const Product = require("../models/product");
const Order = require("../models/order");
const generatePDFonGCS = require("../util/helpers").generatePDFonGCS;

const ITEMS_PER_PAGE = 2;

//Home page for customers
exports.getHome = (req, res, next) => {
  // retrieve what page we are on  
  const page = req.query.page ? +req.query.page : 1;
  let totalItems = 0;
  Product.find()
    .countDocuments()
    .then( numProducts => {
      totalItems = numProducts;
      //console.log(ITEMS_PER_PAGE * page < totalItems); 
      return Product.find()
        .skip( (page - 1) * ITEMS_PER_PAGE )
        .limit(ITEMS_PER_PAGE)
    } )
    .then((products) => { 
      res.render("shop/index", {
        prods: products,
        pageTitle: "Shop",
        path: "/",
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)        
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getProducts = (req, res, next) => {
  const page = req.query.page ? +req.query.page : 1;
  let totalItems = 0;
  Product.find()
    .countDocuments()
    .then( numProducts => {
      totalItems = numProducts;
      //console.log(ITEMS_PER_PAGE * page < totalItems); 
      return Product.find()
        .skip( (page - 1) * ITEMS_PER_PAGE )
        .limit(ITEMS_PER_PAGE)
    } )
    .then((products) => {
      res.render("shop/product-list", {
        prods: products,
        pageTitle: "All Products",
        path: "/products",
        currentPage: page,
        hasNextPage: ITEMS_PER_PAGE * page < totalItems,
        hasPreviousPage: page > 1,
        nextPage: page + 1,
        previousPage: page - 1,
        lastPage: Math.ceil(totalItems / ITEMS_PER_PAGE)        
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getProduct = (req, res, next) => {
  const prodId = req.params.productID;
  Product.findById(prodId)
    .then((product) => {
      res.render("shop/product-detail", {
        product: product,
        pageTitle: product.title,
        path: "/products",
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getCart = (req, res, next) => {
  req.user
    .populate("cart.items.productId")
    .then((user) => {
      const products = user.cart.items;
      //console.log(products);
      const email = user.email;
      res.render("shop/cart", {
        pageTitle: "Your Cart",
        path: "/cart",
        products: products,
        userEmail: email
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postCart = (req, res, next) => {
  const prodId = req.body.productId;
  Product.findById(prodId)
    .then((product) => {
      return req.user.addToCart(product);
    })
    .then((result) => {
      res.redirect("/cart");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postDeleteCartProduct = (req, res, next) => {
  const prodId = req.body.productId;
  req.user
    .removeFromCart(prodId)
    .then((result) => {
      res.redirect("/cart");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postOrder = async (req, res, next) => {

  try {
    const user = await req.user.populate("cart.items.productId");
    const products = user.cart.items.map((i) => {
        return { quantity: i.quantity, product: { ...i.productId._doc } };
    });

    const order = new Order({
      user: {
        email: req.user.email,
        userId: req.user,
      },
      products: products,
    });
    const savedOrder = await order.save();
    const orderID = savedOrder._id;
    // created an invoice pdf with the OrderID and upload to GCS 
    const pdfUrl = await generatePDFonGCS(orderID);
    savedOrder.invoiceUrl = pdfUrl;
    // return the url and save in order collection
    await savedOrder.save();
    await req.user.clearCart();
    res.redirect("/orders");
  } catch(err){
      console.log(err);
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
  }

};

exports.getOrders = (req, res, next) => {
  Order.find({ "user.userId": req.user._id })
    .then((orders) => {
      res.render("shop/orders", {
        pageTitle: "Orders",
        path: "/orders",
        orders: orders,
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.getCheckout = (req, res, next) => {
  let products;
  let total = 0;
  let userEmail;
  req.user
    .populate("cart.items.productId")
    .then((user) => {
      products = user.cart.items;
      userEmail = user.email;
      total = 0;
      products.forEach( p => {
        total += p.quantity * p.productId.price;
      });

      return stripe.checkout.sessions.create({
          payment_method_types: ['card'],
          line_items: products.map(p => {
            return {
              name: p.productId.title,
              description: p.productId.description,
              amount: Math.round(p.productId.price.toFixed(2) * 100),
              currency: 'usd',
              quantity: p.quantity
            }
          }),
          success_url: req.protocol + '://' + req.get('host') + '/checkout/success',
          cancel_url: req.protocol + '://' + req.get('host') + '/checkout/cancel',
      });
    })
    .then(session => {
      res.render("shop/checkout", {
        pageTitle: "Checkout",
        path: "/checkout",
        products: products,
        totalSum: total.toFixed(2),
        sessionId: session.id,
        userEmail: userEmail
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};