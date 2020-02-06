const _ = require('lodash');
const uuid = require('uuid/v1');
const joi = require('@hapi/joi');
const dynamo = require('../utils/aws').dynamo;
const dynamoUtils = require('../utils/aws/dynamoUtils');
const validation = require('../utils/validation');

const SEMESTER_SCHEMA = joi.object({
    uid: joi.string().required(),
    sid: joi.string().required(),
    name: joi.string().required(),
    startDate: joi.date().required(),
    endDate: joi.date().required()
});

async function getAll(req, res) {
    const uid = req.user;
    const semesters = await dynamoUtils.makePaginatedQuery({
        TableName: 'semesters',
        ExpressionAttributeValues: { ':uid': uid },
        KeyConditionExpression: 'uid = :uid'
    });
    res.json(semesters).end();
}

async function create(req, res) {
    const uid = req.user;

    const semester = _.assign({}, req.body, { uid, sid: uuid() });
    validation.check(semester, SEMESTER_SCHEMA);

    await dynamo.put({ TableName: 'semesters', Item: semester }).promise();
    res.json(semester).end();
}

async function update(req, res) {
    const uid = req.user;
    const semester = _.assign({}, req.body, { uid });
    validation.check(semester, SEMESTER_SCHEMA);
    await dynamo.put({ TableName: 'semesters', Item: semester }).promise();
    res.json(semester).end();
}

module.exports = {
    getAll,
    create,
    update
}