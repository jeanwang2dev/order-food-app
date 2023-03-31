const Product = require("../models/product");

exports.getHome = (req, res, next) => {
    Product.find({isfeatured: true})
        .then( products => {
            res.render('shop', {
                prods: products,
                pageTitle: 'Shop Home',
                path: '/',
            });
        })
        .catch( err => {
            console.log(err);
        })
};


exports.getProducts = (req, res, next) => {
    Product.find()
    .then( products => {
        res.render('shop/product-list', {
            prods: products,
            pageTitle: 'Shop Products',
            path: '/',
        });
    })
    .catch(err => {
        console.log(err);
    })
};

exports.getProduct = (req, res, next) => {
    const prodId = req.params.productID;
    Product.findById(prodId)
    .then( product => {
        res.render('shop/product-detail', {
            product: product,
            pageTitle: 'Product Detail',
            path: '/products',
        });
    })
    .catch(err => {
        console.log(err);
    })
};
