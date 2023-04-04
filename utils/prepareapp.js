/* PULL IN THE DEPENDENCIES */
const express = require("express");
const cookieParser = require('cookie-parser')
const path = require("path");
const bodyParser = require("body-parser");
const multer = require("multer");
const session = require("express-session");
const MongoDBStore = require("connect-mongodb-session")(session);

const adminRoutes = require("../routes/admin");
const shopRoutes = require("../routes/shop");
const authRoutes = require("../routes/auth");
const errorRoutes = require("../routes/error");
// const AdminUser = require('../models/administrator');
const Customer = require("../models/customer");
const Guest = require('../models/guest');

const {
  db_username,
  db_password,
  db_name,
  session_secret,
} = require("./config");
const MONTGODB_URI =
  "mongodb+srv://" +
  db_username +
  ":" +
  db_password +
  "@cluster0.beflvhp.mongodb.net/" +
  db_name +
  "?retryWrites=true&w=majority";

const session_store = new MongoDBStore({
  uri: MONTGODB_URI,
  collection: "sessions",
});

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

  /**ADD COOKIE PARSER MIDDLEWARE */
  app.use(cookieParser());

  /*ADD SESSION MIDDLEWARE*/
  app.use(
    session({
      secret: session_secret,
      resave: false,
      saveUninitialized: false,
      store: session_store,
    })
  );

  /** REGISTER A NEW MIDDLEWARE
   TO STORE THE CUSTOMER INFO FROM MONGODB IN MY REQUEST
   SO WE CAN USER IT ANYWHERE IN THE APP */
  app.use((req, res, next) => {
    if( !req.session.customer) {
      return next();
    }
    Customer.findById(req.session.customer._id)
      .then((customer) => {
        if(!customer){
          return next();
        }
        req.customer = customer;
        next();
      })
      .catch((err) => console.log(err));
  });

  /** TO STORE THE GUEST INFO FROM MONGODB IN MY REQUEST
   SO WE CAN USER IT ANYWHERE IN THE APP  */
  app.use((req, res, next) => {
    if( !req.session.guest) {
      return next();
    }
    Guest.findById(req.session.guest._id)
      .then((guest) => {
        if(!guest){
          return next();
        }
        req.guest = guest;
        next();
      })
      .catch((err) => console.log(err));
  });

  /** TEMP code before auth  */
  /* find user and return it to response */
  // app.use( (req, res, next) => {
  //   AdminUser.findById('64289b7b116c8a2ed07c3707')
  //     .then( user => {
  //       req.session.customer = user;
  //       next();
  //     })
  //     .catch( err => console.log(err));
  // })

  // app.use((req, res, next) => {
  //   Customer.findById("6428a5107cd3a7b284f95cdf")
  //     .then((customer) => {
  //       req.session.customer = customer;
  //       next();
  //     })
  //     .catch((err) => console.log(err));
  // });

  /** USE EJS templating engine */
  // doc: http://expressjs.com/en/4x/api.html#app.set
  app.set("view engine", "ejs");
  app.set("views", "views");

  /** ROUTES */
  app.use("/admin", adminRoutes);
  app.use(shopRoutes);
  app.use(authRoutes);
  app.use(errorRoutes);

  /* Return app */
  return app;
};
