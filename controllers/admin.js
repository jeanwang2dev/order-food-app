const sharp = require('sharp');

const Product = require("../models/product");
const { validationResult } = require("express-validator");
const uploadImage2GCS = require('../util/helpers').uploadImage2GCS;
const deleteImageFromGCS = require('../util/helpers').deleteImageFromGSC;

const ITEMS_PER_PAGE = 2;

exports.getAddProduct = (req, res, next) => {
  res.render("admin/edit-product", {
    pageTitle: "Add Product",
    path: "/admin/add-product",
    editing: false,
    infoMsg: null,
    validationErrors: [],
    hasError: false,
  });
};

exports.getEditProduct = (req, res, next) => {
  // console.log("getEditProduct!");
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
        hasError: false,
        infoMsg: null,
        validationErrors: [],
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
};

exports.postAddProduct = async (req, res, next) => {
  console.log("postAddProduct!");
  const title = req.body.title;
  const image = req.file;
  const price = req.body.price;
  const description = req.body.description;
  // console.log(image);
  if (!image) {
    console.log('No image file picked.');
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Add Product",
      path: "/admin/add-product",
      editing: false,
      hasError: true,
      product: {
        title: title,
        price: price,
        description: description,
      },
      infoMsg: "Attached file is not an image",
      validationErrors: [],
    });
  }
  //validation
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    //console.log(errors.array());
    // if there is validation errors then render the login page
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Add Product",
      path: "/admin/add-product",
      editing: false,
      hasError: true,
      product: {
        title: title,
        price: price,
        description: description,
      },
      infoMsg: errors.array()[0].msg,
      validationErrors: errors.array(),
    });
  }
  let imageUrl = '';
  // upload image to GCS
  try {
    const file = req.file;
    const thumbnail = {
        fieldname: file.fieldname,
        originalname: `tb_${file.originalname}`,
        encoding: file.encoding,
        mimetype: file.mimetype,
        buffer: await sharp(file.buffer).resize({ width: 500 }).toBuffer()
      }
     imageUrl = await uploadImage2GCS(thumbnail);
    // imageUrl = 'https://cdn.pixabay.com/photo/2022/06/20/17/17/mountain-7274247_960_720.jpg';
     console.log("Image uploaded.");
  } catch (error) {
    console.log(error);
    console.log("Image upload failed.");
    next(error)
  }

  //const imageUrl = image.path;
  const product = new Product({
    //_id: new mongoose.Types.ObjectId('62c4b1ae59c8ee0cf8a61a6e'),
    title: title,
    price: price,
    imageUrl: imageUrl,
    description: description,
    userId: req.user,
  });
  product
    .save()
    .then((result) => {
      console.log("Created Product");
      //res.redirect("/admin/products");
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
  Product.find()
    .countDocuments()  
    .then( numProducts => {
      //console.log(numProducts);
      let page;
      if(numProducts === 0) {
        page = 1;
      } else {
        page = Math.floor(numProducts/ITEMS_PER_PAGE) + numProducts%ITEMS_PER_PAGE;
      }
      //console.log(page);
      res.redirect("/admin/products/" + "?page=" + page);
    })
    .catch( err => {
      next(err);
    })
};

exports.postEditProduct = async (req, res, next) => {
  console.log("postEditProduct!");
  // fetch info for the product 
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedImage = req.file;
  const updatedPrice = req.body.price;
  const updatedDesc = req.body.description;
  console.log(updatedImage);
  if(!updatedImage) {
    console.log('no new image picked.');
  }
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    //console.log(errors.array());
    // if there is validation errors then render the login page
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Edit Product",
      path: "/admin/edit-product",
      editing: true,
      hasError: true,
      product: {
        title: updatedTitle,
        price: updatedPrice,
        description: updatedDesc,
        _id: prodId,
      },
      infoMsg: errors.array()[0].msg,
      validationErrors: errors.array(),
    });
  }

  //const updatedImageUrl = updatedImage.path;
  const product = await Product.findById(prodId);
  if (product.userId.toString() !== req.user._id.toString()) {
    // if not then redirect
    return res.redirect("/");
  }  
  product.title = updatedTitle;
  product.price = updatedPrice;
  product.description = updatedDesc;
  let imageUrl = '';
  if (updatedImage) {
    try {
      const file = updatedImage;
      const thumbnail = {
        fieldname: file.fieldname,
        originalname: `tb_${file.originalname}`,
        encoding: file.encoding,
        mimetype: file.mimetype,
        buffer: await sharp(file.buffer).resize({ width: 500 }).toBuffer()
      } 
      //upload new image
      imageUrl = await uploadImage2GCS(thumbnail);
      console.log("Image uploaded.");
      // delete the old image
      await deleteImageFromGCS(product.imageUrl);
      product.imageUrl = imageUrl;
    } catch (err){
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    }
  } 
  await product.save();
  console.log("Updated Product");
  res.redirect("/admin/products");

};

exports.deleteProduct = async (req, res, next) => {
  const idToDelete = req.params.productId;
  try {
    // find the product and remove the image on server
    const product =  await Product.findById(idToDelete);
    if (!product) {
      return next(new Error("Product not found."));
    }
    if(product.imageUrl) {
      await deleteImageFromGCS(product.imageUrl);
    }
    await Product.deleteOne({ _id: idToDelete, userId: req.user._id });
    console.log('Delete PRODUCT');
      //res.redirect("/admin/products");
      res.status(200).json({
        message: "Success!"
      });
  } catch(err) {
      res.status(500).json({
        message: 'Deleting product failed'
      });
  }

  // without aysnc and await
  // find the product and remove the image on server
  // Product.findById(idToDelete)
  //   .then((product) => {
  //     if (!product) {
  //       return next(new Error("Product not found."));
  //     }
  //     return  Product.deleteOne({ _id: idToDelete, userId: req.user._id })
  //   })
  //   .then(() => {
  //     console.log('Delete PRODUCT');
  //     //res.redirect("/admin/products");
  //     res.status(200).json({
  //       message: "Success!"
  //     });
  //   })
  //   .catch((err) => {
  //     res.status(500).json({
  //       message: 'Deleting product failed'
  //     });
  //   });

};

exports.getProducts = (req, res, next) => {
  const page = req.query.page ? +req.query.page : 1;
  let totalItems = 0;
  //only show the products that created by the current user
  Product.find({ userId: req.user._id }) 
    // .select('title price -_id')
    // .populate('userId' , 'name')
    .countDocuments()
    .then( numProducts => {
      totalItems = numProducts;
      //console.log(ITEMS_PER_PAGE * page < totalItems); 
      return Product.find({ userId: req.user._id })
        .skip( (page - 1) * ITEMS_PER_PAGE )
        .limit(ITEMS_PER_PAGE)
    } )
    .then((products) => {
      res.render("admin/product-list", {
        prods: products,
        pageTitle: "Admin Products",
        path: "/admin/products",
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
