const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const multer = require('multer');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const errorRoutes = require('./routes/error');
const { db_username, db_password, db_name, port } = require('./utils/config');

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

const MONTGODB_URI = "mongodb+srv://" + db_username + ":" + db_password +"@cluster0.beflvhp.mongodb.net/" + db_name + "?retryWrites=true&w=majority";

const app = express();

/** REGISTER PARSER BEFORE ROUTE HANDLING MIDDLEWARES */
/** IT CALLS NEXT AT THE END */
app.use(bodyParser.urlencoded({ extended: false }));

/*REGISTER THE MULTER MIDDLEWARE FOR FILE UPLOAD 
  MULTER HAS TO BE EXE AS A FUNCTION*/
// app.use(multer({storage: fileStorage, fileFilter: fileFilter }).single('image'));
app.use(upload.single('image'));

/*SERVE STATIC FOLDER*/
app.use(express.static(path.join(__dirname, 'public')));

/** USE EJS templating engine */
// doc: http://expressjs.com/en/4x/api.html#app.set
app.set('view engine', 'ejs');
app.set('views', 'views'); 


/** ROUTES */
app.use('/admin', adminRoutes);
app.use(shopRoutes);
app.use(errorRoutes);

// app.listen(port, () => console.log(`Server listening on port: ` + port));

mongoose
  .connect( MONTGODB_URI)
  .then(result=> {
    console.log("db connected!");
    app.listen(port, () => {
        console.log(`Server listening on port: ` + port)
    });
  })
  .catch((err) => {
    console.log(err);
  });