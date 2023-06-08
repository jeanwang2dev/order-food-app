const express = require('express');
const { check, body } = require('express-validator');

const authController = require('../controllers/auth')
const router = express.Router();
const User = require('../models/user');

router.get('/login', authController.getLogin);
router.get('/signup', authController.getSignup);

router.post(
    '/login', 
    [
        body('email')
            .trim()
            .isEmail()
            .withMessage('Please enter a valid email address.')
            .normalizeEmail(),
            // .custom( (value, {req}) => {
            //     //find if the email exists in database
            //     return User.findOne({email: value}).then( userDoc => {
            //         // if not then return a promise reject
            //         if(!userDoc){
            //             return Promise.reject('Invalid Login Credentials!')
            //         }
            //     })
            // }),
        body('password')
            .isLength({min:1}) 
            .withMessage('Please enter your password.')
            .isLength({min:6})    
            .withMessage('Invalid Login Credentials!')
            .trim()
    ],
    authController.postLogin
);

router.post(
  '/signup',
  [
    check('email')
        .isEmail()
        .withMessage('Please enter a valid email')
        .custom( (value, {req}) => {
            // if( value === 'test@test.com'){
            //     throw new Error('This email address if forbidden.');
            // }
            // return true;
            return User.findOne({ email: value }).then((userDoc) => {
              if (userDoc) {
                return Promise.reject(
                    'User with this email alreday exists, please enter a different one.'
                );
              }
            });
        })
        .normalizeEmail(),
    body('password', 'Please enter a password that at least 8 characters, has a mixture of both uppercase and lowercase letters, and a mixture of letters and numbers and At least one Symbol ')
        .isLength({min:8})
        //.isStrongPassword()
        .trim(),
    body('confirmPassword')
        .trim()
        .custom( (value, {req}) => {
            if(value !== req.body.password) {
                throw new Error('Passwords have to match!');
            }
            return true;
        })
        
  ],
  authController.postSignup
); 

router.post('/logout', authController.postLogout);
router.get('/reset', authController.getPSWReset);
router.post('/reset', authController.postPSWReset);
router.get('/reset/:token',authController.getNewPSW);
router.post('/new-psw', authController.postNewPSW);

module.exports = router;