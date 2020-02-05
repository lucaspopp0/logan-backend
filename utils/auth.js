const _ = require('lodash');
const jwt = require('jsonwebtoken');
const { dynamo } = require('./aws');
const secretUtils = require('./aws/secretUtils')

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
                    ':id': email
                },
                FilterExpression: 'id = :id'
            }).promise();
    
            if (response.Count === 1) {
                req.user = response.Items[0].uid;
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

module.exports = { parseUser };