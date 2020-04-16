// Initializes the server
const _ = require('lodash');
const express = require('express');
const bodyParser = require('body-parser');
const router = require('./router');
const authUtils = require('./utils/auth');

const app = express();

// Add some CORS headers to the response
app.use((_, res, next) => {
    res.set({
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
        'Access-Control-Allow-Headers': ['Authorization', 'Accept', 'Content-Type']
    });
    
    next();
})

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use((req, res, next) => {
    req.client = _.get(req, ['headers', 'client-type']);
    next();
});

router.tagAuthedRoutes(app);
app.use(authUtils.parseUser);
router.setRoutes(app);

module.exports = app;