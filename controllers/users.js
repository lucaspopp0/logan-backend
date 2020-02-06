const dynamo = require('../utils/aws').dynamo;
const uuid = require('uuid/v1');
const validation = require('../utils/validation')

async function createUser(req, res) {
    let { email, name } = validation.requireBodyParams(req, ['email', 'name']);

    if (typeof email !== "string" || (email = email.trim()).length === 0) throw new Error('email must be a non-empty string');
    if (typeof name !== "string" || (name = name.trim()).length === 0) throw new Error('name must be a non-empty string');
    
    const uid = uuid();

    const existingCheck = await dynamo.scan({
        TableName: 'users',
        ExpressionAttributeValues: { ':email': email },
        FilterExpression: 'email = :email'
    }).promise();

    if (existingCheck.Items.length > 0) throw new Error(`User with email '${email}' already exists`);

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