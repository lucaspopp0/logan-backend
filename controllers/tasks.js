const _ = require('lodash');
const dynamo = require('../utils/aws').dynamo;
const dynamoUtils = require('../utils/aws/dynamoUtils');

async function getTasks(req, res) {
    const uid = req.user;
    const tasks = await dynamoUtils.makePaginatedQuery({
        TableName: 'tasks',
        ExpressionAttributeValues: {
            ':uid': uid
        },
        KeyConditionExpression: 'uid = :uid'
    });
    res.json(tasks);
}

module.exports = {
    getTasks
};