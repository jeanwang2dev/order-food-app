/* PULL IN THE DEPENDENCIES */
const express = require("express");
const path = require("path");
const bodyParser = require("body-parser");
const multer = require("multer");

const adminRoutes = require("../routes/admin");
const shopRoutes = require("../routes/shop");
const errorRoutes = require("../routes/error");
// const AdminUser = require('../models/administrator');
const Customer = require("../models/customer");

/* CONTROL WHICH FILES SHOULD BE UPLOADED OR SKIPPED*/
const fileFilter = (req, file, cb) => {
  if (
    file.mimetype === "image/png" ||
    file.mimetype === "image/jpg" ||
    file.mimetype === "image/jpeg"
  ) {
    // To accept the file pass `true`, like so:
    cb(null, true);
  } else {
    // To reject this file pass `false`, like so:
    cb(null, false);
  }
};

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // No larger than 5mb, change as you need
  },
  fileFilter: fileFilter,
});

module.exports = function (app) {
  /** REGISTER PARSER BEFORE ROUTE HANDLING MIDDLEWARES */
  /** IT CALLS NEXT AT THE END */
  app.use(bodyParser.urlencoded({ extended: false }));

  /*REGISTER THE MULTER MIDDLEWARE FOR FILE UPLOAD 
    MULTER HAS TO BE EXE AS A FUNCTION*/
  // app.use(multer({storage: fileStorage, fileFilter: fileFilter }).single('image'));
  app.use(upload.single("image"));

  /*SERVE STATIC FOLDER*/
  app.use(express.static(path.join(__dirname, "../", "public")));

  /* find user and return it to response */
  // app.use( (req, res, next) => {
  //   AdminUser.findById('64289b7b116c8a2ed07c3707')
  //     .then( user => {
  //       req.customer = user;
  //       next();
  //     })
  //     .catch( err => console.log(err));
  // })

  app.use((req, res, next) => {
    Customer.findById("6428a5107cd3a7b284f95cdf")
      .then((customer) => {
        req.customer = customer;
        next();
      })
      .catch((err) => console.log(err));
  });

  /** USE EJS templating engine */
  // doc: http://expressjs.com/en/4x/api.html#app.set
  app.set("view engine", "ejs");
  app.set("views", "views");

  /** ROUTES */
  app.use("/admin", adminRoutes);
  app.use(shopRoutes);
  app.use(errorRoutes);

  /* Return app */
  return app;
};
