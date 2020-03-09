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
    priority: joi.number().integer().min(-2).max(2).required(),
    completed: joi.boolean().required(),
    relatedAid: joi.string(),
    commitmentId: joi.string().when('relatedAid', { is: joi.exist(), then: joi.required() }),
    completionDate: joi.date().when('completed', { is: true, then: joi.required() })
});

async function getAll(req, res) {
    const uid = req.user;
    const tasks = await dynamoUtils.makePaginatedQuery({
        TableName: 'tasks',
        ExpressionAttributeValues: { ':uid': uid },
        KeyConditionExpression: 'uid = :uid'
    });
    res.json(tasks).end();
}

async function create(req, res) {
    const uid = req.user;

    const task = _.assign({}, req.body, { tid: uuid(), uid });
    _.defaults(task, { completed: false });

    validation.check(task, TASK_SCHEMA);

    await dynamo.put({ TableName: 'tasks', Item: task }).promise();
    res.json(task).end();
}

async function update(req, res) {
    const uid = req.user;
    const task = _.assign({}, req.body, { uid });
    validation.check(task, TASK_SCHEMA);
    await dynamo.put({ TableName: 'tasks', Item: task }).promise();
    res.json(task).end();
}

async function del(req, res) {
    validation.check(req.body, joi.object({ 
        uid: joi.string(),
        tid: joi.string().required()
    }));

    const uid = req.user;
    const tid = req.body.tid;

    await dynamo.delete({
        TableName: 'tasks',
        Key: { uid, tid }
    }).promise();

    res.end();
}

module.exports = {
    getAll,
    create,
    update,
    delete: del
};