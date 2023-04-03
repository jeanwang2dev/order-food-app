const express = require('express');
const mongoose = require('mongoose');
const prepareapp = require('./utils/prepareapp');

const { db_username, db_password, db_name, port } = require('./utils/config');
// const Admin = require('./models/administrator');
const Customer = require('./models/customer');

const MONTGODB_URI = "mongodb+srv://" + db_username + ":" + db_password +"@cluster0.beflvhp.mongodb.net/" + db_name + "?retryWrites=true&w=majority";

let app = express();
app = prepareapp(app);

mongoose
  .connect( MONTGODB_URI)
  .then(result=> {
    console.log("db connected!");
    Customer.findOne().then( user => {
      if(!user) {
        const customer = new Customer({
          name: 'Jane Doe',
          email: 'test1@temptesting.com',
          cart: {
            items: []
          }
        });
        customer.save();
      }
    })
    // Admin.findOne().then( user => {
    //   if(!user) {
    //     const adminUser = new Admin({
    //       name: 'Jean',
    //       email: 'jean@test.com'
    //     });
    //     adminUser.save();
    //   }
    // });
    app.listen(port, () => {
        console.log(`Server listening on port: ` + port)
    });
  })
  .catch((err) => {
    console.log(err);
  });