const express = require('express');

const router = express.Router();
const shopController = require('../controllers/shop');

router.get('/', shopController.getHome);
router.get('/products', shopController.getProducts);
router.get('/products/:productID', shopController.getProduct);
router.get('/cart', shopController.getCart);
router.get('/checkout');
router.get('/checkout/success');
router.get('/checkout/cancel');
router.get('/orders', shopController.getOrders);

router.post('/cart', shopController.postCart);
router.post('/cart-delete-item', shopController.postDeleteCartProduct);

module.exports = router;