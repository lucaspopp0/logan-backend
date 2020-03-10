const _ = require('lodash');
const uuid = require('uuid/v1');
const joi = require('@hapi/joi');
const dynamo = require('../utils/aws').dynamo;
const dynamoUtils = require('../utils/aws/dynamoUtils');
const validation = require('../utils/validation');

const SECTION_SCHEMA = joi.object({
    uid: joi.string().required(),
    secid: joi.string().required(),
    cid: joi.string().required(),
    name: joi.string().required(),
    location: joi.string().allow(''),
    weeklyRepeat: joi.number().integer(),
    daysOfWeek: joi.string().regex(/^[0-6]{1,7}$/),
    start: joi.date().required(),
    end: joi.date().required()
});

async function getAll(req, res) {
    const uid = req.user;
    const sections = await dynamoUtils.pagination.query({
        TableName: 'sections',
        ExpressionAttributeValues: { ':uid': uid },
        KeyConditionExpression: 'uid = :uid'
    });

    const response = {};
    for (const section of sections) {
        if (!response[section.cid]) response[section.cid] = [];
        response[section.cid].push(section);
    }

    res.json(response).end();
}

async function create(req, res) {
    const uid = req.user;

    const section = _.assign({}, req.body, { uid, secid: uuid() });
    validation.check(section, SECTION_SCHEMA);

    await dynamo.put({ TableName: 'sections', Item: section }).promise();
    res.json(section).end();
}

async function update(req, res) {
    const uid = req.user;
    const section = _.assign({}, req.body, { uid });
    validation.check(section, SECTION_SCHEMA);
    await dynamo.put({ TableName: 'sections', Item: section }).promise();
    res.json(section).end();
}

async function del(req, res) {
    validation.check(req.body, joi.object({ 
        uid: joi.string(),
        secid: joi.string().required()
    }));

    const uid = req.user;
    const secid = req.body.siecd;

    await dynamo.delete({
        TableName: 'sections',
        Key: { uid, secid }
    }).promise();

    res.end();
}

module.exports = {
    getAll,
    create,
    update,
    delete: del
}