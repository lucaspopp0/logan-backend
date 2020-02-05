// Initializes the server
const express = require('express');
const bodyParser = require('body-parser');
const router = require('./router');

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

router.tagAuthedRoutes(app);
router.setRoutes(app);

module.exports = app;