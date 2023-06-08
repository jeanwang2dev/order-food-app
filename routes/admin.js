const express = require('express');
const { body } = require('express-validator');

const adminController = require('../controllers/admin');
const isAuth = require('../middleware/is-auth');

const router = express.Router();

// this route reaches '/admin/add-proudut' --- GET
router.get('/add-product', isAuth, adminController.getAddProduct);

// this route reaches '/admin/products' --- GET
router.get('/products', isAuth, adminController.getProducts);

// this route reaches '/admin/add-proudut' --- POST
router.post('/add-product',
    [
        body('title')
            .isLength({min:2}) 
            .withMessage('Please enter a title longer than five characters')
            .isString()
            .withMessage('Please enter a title for the product'),
        body('price')
            .trim()
            .isFloat()
            .withMessage('Please enter a valid price for the product'),
        body('description')
            .trim()
            .isLength({min:2, max: 400}) 
            .withMessage('Please enter a description for the product'),            
    ],
    isAuth,
    adminController.postAddProduct);

router.get('/edit-product/:productId', isAuth, adminController.getEditProduct);

router.post('/edit-product', 
    [
        body('title')
            .isLength({min:2}) 
            .withMessage('Please enter a title name longer than five characters')
            .isString()
            .trim()
            .withMessage('Please enter a title for the product'),
        body('price')
            .trim()
            .isFloat()
            .withMessage('Please enter a valid price for the product'),
        body('description')
            .trim()
            .isLength({min:2, max: 400}) 
            .withMessage('Please enter a description for the product'),            
    ],
    isAuth, 
    adminController.postEditProduct);

//router.post('/delete-product', isAuth, adminController.postDeleteProduct);
router.delete('/product/:productId', isAuth, adminController.deleteProduct);

module.exports = router;
//exports.routes = router;
