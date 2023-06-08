const path = require('path');
const fs = require('fs');

const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const session = require('express-session');
const MongoDBStore = require('connect-mongodb-session')(session);
const csrf = require('csurf');
const flash = require('connect-flash');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');

const errorController = require('./controllers/error');
const { db_username, db_password, port } = require('./util/config');
const User = require('./models/user');

const MONTGODB_URI = "mongodb+srv://" + db_username + ":" + db_password +"@cluster0.beflvhp.mongodb.net/shop?retryWrites=true&w=majority";

const app = express();
const store = new MongoDBStore({
  uri: MONTGODB_URI,
  collection: 'sessions'
});
const csrfProtection = csrf();

/* CONTROL WHICH FILES SHOULD BE UPLOADED OR SKIPPED*/
const fileFilter = (req, file, cb) => {
  if( 
    file.mimetype === 'image/png' || 
    file.mimetype === 'image/jpg' || 
    file.mimetype === 'image/jpeg') {
    // To accept the file pass `true`, like so:
    cb(null, true);
  }  else {
    // To reject this file pass `false`, like so:
    cb(null, false);
  }
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
      fileSize: 5 * 1024 * 1024, // No larger than 5mb, change as you need
  },
  fileFilter: fileFilter  
});

// doc: http://expressjs.com/en/4x/api.html#app.set
app.set('view engine', 'ejs');
app.set('views', 'views'); 

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const authRoutes = require('./routes/auth');
const scriptSources = ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://js.stripe.com/v3/" ];
const accessLogStream = fs.createWriteStream(
  path.join(__dirname, 'access.log'),
  { flages: 'a'}
);

app.use(  helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'", "https://js.stripe.com/v3/"],
    scriptSrc: scriptSources,
    connectSrc: ["'self'"],
    styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
    imgSrc: ["'self'", "https://storage.googleapis.com/"],
  },
}));
app.use(compression());
app.use(morgan('combined', { stream: accessLogStream }));


/*REGISTER THE PARSER MIDDLEWARE */
app.use(bodyParser.urlencoded({ extended: false }));

/*REGISTER THE MULTER MIDDLEWARE FOR FILE UPLOAD 
  MULTER HAS TO BE EXE AS A FUNCTION*/
// app.use(multer({storage: fileStorage, fileFilter: fileFilter }).single('image'));
app.use(upload.single('image'));

/*SERVE STATIC FOLDER*/
app.use(express.static(path.join(__dirname, 'public')));
//app.use('/uploaded-images', express.static(path.join(__dirname, 'uploaded-images')));
//app.use(express.static(path.join(__dirname, 'data/invoices')));

/*SET UP THE SESSION*/
app.use(
  session({ 
    secret: 'thisisasecret',
    resave: false,
    saveUninitialized: false,
    store: store
  })
);
// add csrf Protection after session created
app.use(csrfProtection);
// registered(initialized) after the session created
app.use(flash());

// add a new middleware (special feature provided by expressjs)
// the special field on the response: the locals field
app.use((req, res, next) => {
  res.locals.isAuthenticated = req.session.isLoggedIn;
  res.locals.csrfToken = req.csrfToken();
  next();
});

// register a new middleware
// store the user in my request so I can use it from anywhere in my app
app.use((req, res, next) => {
  //throw new Error('Dummy');
  if( !req.session.user) {
    return next();
  }
  User.findById(req.session.user._id)
    .then((user) => {
      //throw new Error('Dummy');
      //check for existence of user
      if(!user){
        return next();
      }
      req.user = user;
      next();
    })
    // this catch block won't fire if we cannot find the user with the id
    // it will only fire if there are any technical issues like db down or user not having permission
    .catch((err) =>  {
      next(new Error(err));
      //throw new Error(err);
      //console.log(err);
    });
});


// this filtering mechanism allow us to put a common starting segment for our path
// which all routes in a given file(routes/admin.js) use to outsource in app.js
// so we don't have to repeat it for all routes in the admin.js file

/* Once you mount a router onto an Express app, any subsequently declared middleware on that app won't get called for any requests that target the router.*/
app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(authRoutes);


// catch all middleware for sending a 404 page
app.use('/', errorController.get404);

app.get('/500', errorController.get500);

app.use((error, req, res, next) => {
  //res.redirect('/500');
    console.log(error);
    res.render('500', {
      pageTitle: 'Interal Error',
      path: '/500',
      isAuthenticated: req.session.isLoggedIn
  });
});

mongoose
  .connect( MONTGODB_URI)
  .then(result=> {
    console.log("connected!");
    app.listen(port);
  })
  .catch((err) => {
    console.log(err);
  });
