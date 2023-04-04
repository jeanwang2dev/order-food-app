const Customer = require('../models/customer');

exports.getLogin = (req, res, next) => {
    res.render('auth/login', { 
        pageTitle: 'Login', 
        path:'/login', 
        isAuthenticated: req.session.isCustomerLoggedIn
    });    
};

exports.postLogin = (req, res, next) => {
    Customer.findById("6428a5107cd3a7b284f95cdf")
      .then((customer) => {
        req.session.isCustomerLoggedIn = true;
        req.session.customer = customer;
        res.redirect('/');
      })
      .catch((err) => console.log(err));
};
    

exports.getSignup = (req, res, next) => {   
    res.render('auth/signup', { 
        pageTitle: 'Signup', 
        path:'/signup', 
        isAuthenticated: req.session.isCustomerLoggedIn
    });

};

exports.postSignup = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    // the validationResult function will go through the error object on request
    // and collect them all to the errors constant
    // const errors = validationResult(req);
    // if( !errors.isEmpty() ) {
    //   return res.status(422).render('auth/signup', { 
    //     pageTitle: 'Signup', 
    //     path:'/signup', 
    //     infoMsg: errors.array()[0].msg,
    //     oldInput: {
    //       email: email,
    //       password: password,
    //       confirmPassword :req.body.confirmPassword,
    //     },
    //     validationErrors: errors.array()
    //   });
    // }
  
    bcrypt
        .hash(password, 12)
        .then((hashedPassword) => {
          const user = new User({
            email: email,
            password: hashedPassword,
            cart: { items: [] },
          });
          return user.save();
        })
        .then((result) => {
          res.redirect("/login");
          return mailTransporter.sendMail({
            to: email,
            from: fromEmail,
            subject: 'Signup succeeded!',
            html: '<h1>You successfully signed up!</h1>'
          }, (err) => {
            console.log(err);
            // console.log(info.envelope);
            // console.log(info.messageId);
          });     
        })
        .catch( err => {
          const error = new Error(err);
          error.httpStatusCode = 500;
          return next(error);
        });
};

exports.postLogout = (req, res, next) => {
    req.session.destroy( err => {
        // console.log("postLogout: " + err);
        res.redirect('/');
    });
};