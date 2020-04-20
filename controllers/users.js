const uuid = require('uuid/v1');
const joi = require('@hapi/joi');
const dynamo = require('../utils/aws').dynamo;
const validation = require('../utils/validation')

async function getMe(req, res) {
    const uid = req.user;
    const user = await dynamo.get({
        TableName: 'users',
        Key: { id: uid }
    }).promise();
    res.json(user.Item).end();
}

async function create(req, res) {
    validation.check(req.body, joi.object({
        email: joi.string().email().required(),
        name: joi.string().required()
    }));

    const { email, name } = req.body;
    
    const uid = uuid();

    // Check if the user already exists
    const existingCheck = await dynamo.scan({
        TableName: 'users',
        ExpressionAttributeValues: { ':email': email },
        FilterExpression: 'email = :email'
    }).promise();

    if (existingCheck.Items.length > 0) throw new Error(`User with this email already exists`);

    const user = { id: uid, email, name };

    await dynamo.put({
        TableName: 'users',
        Item: user
    }).promise();

    res.json(user).end();
}

module.exports = {
    getMe,
    create
};