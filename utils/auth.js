const _ = require('lodash');
const jwt = require('jsonwebtoken');
const { dynamo } = require('./aws');
const secretUtils = require('./aws/secretUtils');
const { OAuth2Client } = require('google-auth-library');

async function verifyGoogleToken(req, res) {
    const { clientId, clientSecret } = await secretUtils.get('googlecreds');

    const gapi = new OAuth2Client(clientId);
    const ticket = await gapi.verifyIdTokenAsync({
        idToken: req.body.idToken,
        audience: clientId
    });

    const payload = ticket.getPayload();
    const token = jwt.sign(payload.email, clientSecret);
    res.json({ bearer: token }).end();
}

async function parseUser(req, res, next) {
    if (req.requiresAuth) {
        const authHeader = _.get(req, ['headers', 'authorization']);
        if (!authHeader) {
            res.status(400).end('Missing bearer token');
            return;
        }

        const { clientSecret } = await secretUtils.get('googlecreds');
    
        try {
            const token = authHeader.substring(7);
            
            let email;

            if (token.indexOf("DEV ") === 0) email = token.substring(4);
            else email = jwt.verify(token, clientSecret);
            
            const response = await dynamo.scan({
                TableName: 'users',
                ExpressionAttributeValues: {
                    ':email': email
                },
                FilterExpression: 'email = :email'
            }).promise();
    
            if (response.Count === 1) {
                req.user = response.Items[0].id;
                next();
            } else if (response.Count === 0) {
                res.status(400).end('Bearer token doesn\'t belong to a valid user.');
                console.log('No user with email: ' + email);
            } else {
                res.status(400).end('Duplicate users exist');
                console.log(`Duplicate users with email: ${email}`);
            }
        } catch(err) {
            res.status(400).end('Invalid bearer token');
            console.error(err.stack);
        }
    } else {
        next();
    }
}

module.exports = { verifyGoogleToken, parseUser };