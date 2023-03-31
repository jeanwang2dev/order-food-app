const Product = require("../models/product");

exports.getProducts = (req, res, next) => {
  Product.find()
  .then( products => {
      res.render('admin/product-list', {
          prods: products,
          pageTitle: 'Shop Products',
          path: '/',
          hasProducts: products.length > 0,
          activeShop: true,
          productCSS: true
      });
  })
  .catch(err => {
      console.log(err);
  })
};

exports.getAddProduct = (req, res, next) => {
    res.render('admin/edit-product', {
        pageTitle: 'Add Product',
        path: '/admin/add-product',
        editing: false,
    });
};

exports.getEditProduct = (req, res, next) => {
  console.log("getEditProduct!");
  const editMode = req.query.edit;
  if (!editMode) {
    return res.redirect("/");
  }
  const prodId = req.params.productId;
  Product.findById(prodId)
    .then((product) => {
      if (!product) {
        return res.redirect("/");
      }
      res.render("admin/edit-product", {
        pageTitle: "Edit Product",
        path: "/admin/edit-product",
        editing: editMode,
        product: product,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.postAddProduct = (req, res, next) => {
  console.log("postAddProduct!");
  const title = req.body.title;
  const isfeatured = req.body.isfeatured == 1 ? true: false;
  const product = new Product({
      //_id: new mongoose.Types.ObjectId('62c4b1ae59c8ee0cf8a61a6e'),
      title: title,
      isfeatured: isfeatured
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
  res.redirect('/admin/products');
};

exports.postEditProduct = async (req, res, next) => {
  console.log("postEditProduct!");
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedIsFeatured = req.body.isfeatured == 1 ? true: false;

  const product = await Product.findById(prodId);
  console.log(product);
  product.title = updatedTitle;
  product.isfeatured = updatedIsFeatured;
  await product.save();
  console.log("Updated Product");
  res.redirect("/admin/products");

}