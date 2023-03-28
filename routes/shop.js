const express = require('express');

const router = express.Router();
const Product = require("../models/product");

router.get('/', (req, res, next) => {
    Product.find()
    .then( products => {
        res.render('shop/product-list', {
            prods: products,
            pageTitle: 'Shop',
            path: '/',
            hasProducts: products.length > 0,
            activeShop: true,
            productCSS: true
        });
    })
    .catch(err => {
        console.log(err);
    })
});

module.exports = router;