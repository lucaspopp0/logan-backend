const _ = require('lodash');
const dynamo = require('../utils/aws').dynamo;
const dynamoUtils = require('../utils/aws/dynamoUtils');
const validation = require('../utils/validation');
const uuid = require('uuid/v1');

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

async function createTask(req, res) {
    const uid = req.user;
    const { title, priority, dueDate } = validation.requireBodyParams(req, ['title', 'priority', 'dueDate']);

    const task = { 
        tid: uuid(), 
        uid,
        title,
        priority,
        dueDate
    }

    // TODO: Validate params
    _.assign(task, _.pick(req.body, ['description', 'completed', 'commitmentId', 'relatedAssignment', 'completionDate']));
    _.defaults(task, { completed: false, description: '' });

    await dynamo.put({ TableName: 'tasks', Item: task }).promise();
    res.json(task).end();
}

module.exports = {
    getTasks,
    createTask
};