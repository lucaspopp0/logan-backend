const uuid = require('uuid/v1');
const joi = require('@hapi/joi');
const dynamo = require('../utils/aws').dynamo;
const validation = require('../utils/validation')

async function createUser(req, res) {
    validation.check(req.body, joi.object({
        email: joi.string().email().required(),
        name: joi.string().required()
    }));
    
    const uid = uuid();

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
    createUser
};