const _ = require('lodash');
const uuid = require('uuid/v1');
const joi = require('@hapi/joi');
const dynamo = require('../utils/aws').dynamo;
const dynamoUtils = require('../utils/aws/dynamoUtils');
const validation = require('../utils/validation');

const COURSE_SCHEMA = joi.object({
    uid: joi.string().required(),
    cid: joi.string().required(),
    sid: joi.string().required(),
    name: joi.string().required(),
    nickname: joi.string(),
    descriptor: joi.string(),
    color: joi.string().hex().required()
});

async function getAll(req, res) {
    const uid = req.user;
    const courses = await dynamoUtils.makePaginatedQuery({
        TableName: 'courses',
        ExpressionAttributeValues: { ':uid': uid },
        KeyConditionExpression: 'uid = :uid'
    });
    res.json(courses).end();
}

async function create(req, res) {
    const uid = req.user;

    const course = _.assign({}, req.body, { uid, cid: uuid() });
    validation.check(course, COURSE_SCHEMA);

    await dynamo.put({ TableName: 'courses', Item: course }).promise();
    res.json(course).end();
}

async function update(req, res) {
    const uid = req.user;
    const course = _.assign({}, req.body, { uid });
    validation.check(course, COURSE_SCHEMA);
    await dynamo.put({ TableName: 'courses', Item: course }).promise();
    res.json(course).end();
}

async function del(req, res) {
    validation.check(req.body, joi.object({ 
        uid: joi.string(),
        cid: joi.string().required()
    }));

    const uid = req.user;
    const cid = req.body.cid;

    await dynamo.delete({
        TableName: 'courses',
        Key: { uid, cid }
    }).promise();

    res.end();
}

module.exports = {
    getAll,
    create,
    update,
    delete: del
}