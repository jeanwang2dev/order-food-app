const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');

const adminRoutes = require('./routes/admin');
const shopRoutes = require('./routes/shop');
const errorRoutes = require('./routes/error');
const { db_username, db_password, db_name, port } = require('./utils/config');

const MONTGODB_URI = "mongodb+srv://" + db_username + ":" + db_password +"@cluster0.beflvhp.mongodb.net/" + db_name + "?retryWrites=true&w=majority";

const app = express();

/** REGISTER PARSER BEFORE ROUTE HANDLING MIDDLEWARES */
/** IT CALLS NEXT AT THE END */
app.use(bodyParser.urlencoded({ extended: false }));

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