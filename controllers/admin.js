const Product = require("../models/product");

exports.getAddProduct = (req, res, next) => {
    res.render('admin/add-product', {
        pageTitle: 'AddProduct',
        path: '/admin/add-product',
    });
};

exports.postAddProduct = (req, res, next) => {
    console.log(req.body.title);
    console.log("postAddProduct!");
    const title = req.body.title;
    const product = new Product({
        //_id: new mongoose.Types.ObjectId('62c4b1ae59c8ee0cf8a61a6e'),
        title: title,
      });
    product
    .save()
    .then((result) => {
      console.log("Created Product");
      //res.redirect("/admin/products");
    })
    .catch((err) => {
      console.log(err);
    });  
    res.redirect('/');
};