const express = require('express');

const router = express.Router();

/** app.use() do a base match */
router.use('/', (req, res, next) => {
    res.render('404', {
        pageTitle: 'Page Not Found',
        path: 'notfound'
    });
});

module.exports = router;