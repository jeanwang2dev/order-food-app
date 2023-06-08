const bcrypt = require('bcryptjs');
const nodemailer = require('nodemailer');
const sendgridTransport = require('nodemailer-sendgrid-transport');
const crypto = require('crypto');
const { validationResult } = require('express-validator');

const User = require('../models/user');
const { sendgrid_apikey, site_url, email_domain }= require('../util/config');

const mailTransporter = nodemailer.createTransport(sendgridTransport({
  auth: {
    api_key: sendgrid_apikey
  }
}));

const fromEmail = 'info@' + email_domain;

exports.getLogin = (req, res, next) => {
    let message = req.flash('error');    
    res.render('auth/login', { 
        pageTitle: 'Login', 
        path:'/login', 
        errorMsg: (message.length > 0)? message[0] : null,
        oldInput: {
          email: '',
          password: ''
        },
        validationErrors: []
    });
};

exports.getSignup = (req, res, next) => {
    let message = req.flash('info');    
    res.render('auth/signup', { 
        pageTitle: 'Signup', 
        path:'/signup', 
        infoMsg: (message.length > 0)? message[0] : null,
        oldInput: {
          email: '',
          password: '',
          confirmPassword: '',
        },
        validationErrors: []
    });

}

exports.postLogin = (req, res, next) => {
    const email = req.body.email;
    const password = req.body.password;
    //validation
    const errors = validationResult(req);
    if( !errors.isEmpty() ){
      // if there is validation errors then render the login page 
      return res.status(422).render('auth/login', {
        pageTitle: 'Login', 
        path:'/login', 
        errorMsg: errors.array()[0].msg,
        oldInput: {
          email: email,
          password: password
        },
        validationErrors: errors.array()
      });
    }

    User.findOne({ email: email})
    .then((user) => {
        if( !user){
          // add error msg to flash
          // req.flash('error', 'Invalid Login Credentials!');
          // user not exist, redirect back to login page
          return res.status(422).render('auth/login', {
            pageTitle: 'Login', 
            path:'/login', 
            errorMsg: 'Invalid Login Credentials!',
            oldInput: {
              email: email,
              password: password
            },
            validationErrors: errors.array()
          });
        }
        // found user
        bcrypt
        .compare(password, user.password)
        .then((matchingResult) => {
          if(matchingResult){
            // pw match, create session
            req.session.isLoggedIn = true;
            req.session.user = user;
            return req.session.save( err => {
                //console.log("postLogin Err: " + err);
                res.redirect('/');
            });        
          }
          // pw not match
          // add user msg to flash
          // req.flash('error', 'Invalid Login Credentials!');
          // res.redirect('/login');
          return res.status(422).render('auth/login', {
            pageTitle: 'Login', 
            path:'/login', 
            errorMsg: 'Invalid Login Credentials!',
            oldInput: {
              email: email,
              password: password
            },
            validationErrors: errors.array()
          });
        });  
    })
    .catch((err) => {
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

exports.postSignup = (req, res, next) => {
  const email = req.body.email;
  const password = req.body.password;
  // the validationResult function will go through the error object on request
  // and collect them all to the errors constant
  const errors = validationResult(req);
  if( !errors.isEmpty() ) {
    return res.status(422).render('auth/signup', { 
      pageTitle: 'Signup', 
      path:'/signup', 
      infoMsg: errors.array()[0].msg,
      oldInput: {
        email: email,
        password: password,
        confirmPassword :req.body.confirmPassword,
      },
      validationErrors: errors.array()
    });
  }

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

exports.getPSWReset = (req, res, next) => {
  let message = req.flash('error');  
  res.render('auth/pswreset', { 
      pageTitle: 'Reset Password', 
      path:'/reset', 
      errorMsg: (message.length > 0)? message[0] : null
  });
};

exports.postPSWReset = (req, res, next) => {

  crypto.randomBytes(32, (err, buffer) => {
    if(err) {
      console.log(err);
      return res.redirect('/reset');
    }
    const token = buffer.toString('hex');
    User.findOne({ email: req.body.email })
      .then( user => {
        if(!user){
          req.flash('error', 'No account with that email found');
          return res.redirect('/reset');
        }
        user.resetToken = token;
        user.resetTokenEXP = Date.now() + 3600000
        return user.save().then( result => {
          res.redirect('/');
          mailTransporter.sendMail({
            to: req.body.email,
            from: fromEmail,
            subject: 'Password Reset',
            html: `
              <p>You request a password request, Click the link below</p>
              <p>The link will only valid for one hour</p>
              <p>Click this <a href="${site_url}reset/${token}">link</a> to reset your password</p>
            `
          });    
        });
      })
      .catch((err) => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });
  });
}

exports.getNewPSW = (req, res, next) => {
  const token = req.params.token;
  User.findOne({ resetToken: token, resetTokenEXP: { $gt: Date.now() } })
    .then(user => {
        if(!user){
          req.flash('error', 'something went wrong, please try again.');
          return res.redirect('/reset');
        }
        let message = req.flash('error');
        res.render('auth/new-psw', { 
          pageTitle: 'Reset Password', 
          path:'/new-psw', 
          errorMsg: (message.length > 0)? message[0] : null,
          userId: user._id.toString(),
          email: user.email,
          passwordToken: token
      });
    })
    .catch((err) => {
      const error = new Error(err);
      error.httpStatusCode = 500;
      return next(error);
    });
 
}

exports.postNewPSW = (req, res, next) => {
    const newPassword = req.body.password;
    const userId = req.body.userId;
    const token = req.body.pswToken;
    let resetUser;

    User.findOne({
      _id: userId,
      resetToken: token,
      resetTokenEXP: { $gt: Date.now() },
    })
      .then( user => {
        resetUser = user;
        return bcrypt.hash(newPassword, 12);
      })
      .then( hashedPassword => {
        resetUser.password = hashedPassword;
        resetUser.resetToken = undefined;
        resetUser.resetTokenEXP = undefined;
        return resetUser.save().then( result => {
          res.redirect('/login');
          // you could send another email to confirm the reset
          mailTransporter.sendMail({
            to: req.body.email,
            from: fromEmail,
            subject: 'Password Reset Successful',
            html: `
              <p>You request a password request</p>
              <p>It got reset successfully</p>
            `
          }); 
        });
      })
      .catch((err) => {
        const error = new Error(err);
        error.httpStatusCode = 500;
        return next(error);
      });

}