const _ = require('lodash');
const uuid = require('uuid/v1');
const joi = require('@hapi/joi');
const dynamo = require('../utils/aws').dynamo;
const dynamoUtils = require('../utils/aws/dynamoUtils');
const validation = require('../utils/validation');

const TASK_SCHEMA = joi.object({
    uid: joi.string().required(),
    tid: joi.string().required(),
    title: joi.string().required(),
    description: joi.string(),
    dueDate: joi.string().required(),
    priority: joi.number().integer().min(0).max(4).required(),
    completed: joi.boolean().required(),
    commitmentId: joi.string(),
    relatedAssignment: joi.string(),
    completionDate: joi.date().when('completed', { is: true, then: joi.required() })
});

async function getTasks(req, res) {
    const uid = req.user;
    const tasks = await dynamoUtils.makePaginatedQuery({
        TableName: 'tasks',
        ExpressionAttributeValues: {
            ':uid': uid
        },
        KeyConditionExpression: 'uid = :uid'
    });
    res.json(tasks).end();
}

async function createTask(req, res) {
    const uid = req.user;

    // TODO: Validate params
    const task = _.assign({ tid: uuid(), uid }, req.body);
    _.defaults(task, { completed: false });

    const { error } = TASK_SCHEMA.validate(task);
    if (error) return res.status(400).end(error.details[0].message);

    await dynamo.put({ TableName: 'tasks', Item: task }).promise();
    res.json(task).end();
}

module.exports = {
    getTasks,
    createTask
};