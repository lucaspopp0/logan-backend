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

async function getSemesters(req, res) {
    const uid = req.user;
    const semesters = await dynamoUtils.makePaginatedQuery({
        TableName: 'semesters',
        ExpressionAttributeValues: { ':uid': uid },
        KeyConditionExpression: 'uid = :uid'
    });
    res.json(semesters).end();
}

module.exports = {
    getSemesters
}