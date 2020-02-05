// Runs the server and starts listening on the appropriate port
const moment = require('moment');
const app = require('./app');
const port = process.env.PORT || 3000;

// Start listening for requests
app.listen(port, () => {
    console.log(`Started listening on port ${port} (${moment().format('MMM D YYYY, h:mm A')})`);
});