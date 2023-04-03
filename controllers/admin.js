const Product = require("../models/product");
const uploadImage2GCS = require("../utils/helpers").uploadImage2GCS;
const createThumbnail = require("../utils/helpers").createThumbnail;
const deleteImageFromGCS = require("../utils/helpers").deleteImageFromGSC;

exports.getProducts = (req, res, next) => {
  Product.find()
    .then((products) => {
      res.render("admin/product-list", {
        prods: products,
        pageTitle: "Shop Products",
        path: "/",
        activeShop: true,
        productCSS: true,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.getAddProduct = (req, res, next) => {
  res.render("admin/edit-product", {
    pageTitle: "Add Product",
    path: "/admin/add-product",
    editing: false,
    hasError: false,
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
        hasError: true,
        product: product,
      });
    })
    .catch((err) => {
      console.log(err);
    });
};

exports.postAddProduct = async (req, res, next) => {
  console.log("postAddProduct!");
  const title = req.body.title;
  const image = req.file;
  const isfeatured = req.body.isfeatured == 1 ? true : false;
  const price = req.body.price;
  const desc = req.body.description;

  // if no image got picked
  if (!image) {
    console.log("No image file picked.");
    return res.status(422).render("admin/edit-product", {
      pageTitle: "Add Product",
      path: "/admin/add-product",
      editing: false,
      hasError: true,
      product: {
        title: title,
        isfeatured: isfeatured,
        price: price,
        description: desc,
      },
    });
  }
  // upload image to GCS
  let imageUrl = "";
  try {
    const thumbnail = await createThumbnail(image);
    imageUrl = await uploadImage2GCS(thumbnail);
    console.log("Image uploaded.");
  } catch (error) {
    console.log(error);
    console.log("Image upload failed.");
    next(error);
  }

  // create product
  const product = new Product({
    title: title,
    isfeatured: isfeatured,
    price: price,
    imageUrl: imageUrl,
    description: desc,
    adminId: req.customer,
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
  res.redirect("/admin/products");
};

exports.postEditProduct = async (req, res, next) => {
  console.log("postEditProduct!");
  const prodId = req.body.productId;
  const updatedTitle = req.body.title;
  const updatedIsFeatured = req.body.isfeatured == 1 ? true : false;
  const updatedImage = req.file;
  const updatedPrice = req.body.price;
  const updatedDesc = req.body.description;

  // find the product and update it
  const product = await Product.findById(prodId);
  // upload image to GCS if new image picked
  if (!updatedImage) {
    console.log("no new image picked.");
  } else {
    try {
      //upload new image
      const thumbnail = await createThumbnail(updatedImage);
      let imageUrl = await uploadImage2GCS(thumbnail);

      console.log("New Image uploaded.");
      // delete the old image
      if (product.imageUrl && product.imageUrl !== "") {
        await deleteImageFromGCS(product.imageUrl);
      }
      // update product imageUrl
      product.imageUrl = imageUrl;
    } catch (error) {
      console.log(error);
      console.log("Image upload failed.");
      next(error);
    }
  }

  //console.log(product);
  product.title = updatedTitle;
  product.isfeatured = updatedIsFeatured;
  product.price = updatedPrice;
  product.description = updatedDesc;

  await product.save();
  console.log("Updated Product");
  res.redirect("/admin/products");
};

exports.postDeleteProduct = async (req, res, next) => {
  const idToDelete = req.body.productId;
  try {
    const product = await Product.findByIdAndRemove(idToDelete);
    //console.log(product);
    if (!product) {
      return next(new Error("Product to be deleted not found."));
    }
    if (product.imageUrl) {
      await deleteImageFromGCS(product.imageUrl);
    }
    console.log("Delete PRODUCT");
    res.redirect("/admin/products");
  } catch (err) {
    console.log(err);
  }
};
