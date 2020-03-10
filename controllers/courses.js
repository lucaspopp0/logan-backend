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
    const courses = await dynamoUtils.pagination.query({
        TableName: 'courses',
        ExpressionAttributeValues: { ':uid': uid },
        KeyConditionExpression: 'uid = :uid'
    });

    const response = {};

    for (const course of courses) {
        if (!response[course.sid]) response[course.sid] = [];
        response[course.sid].push(course);
    }

    res.json(response).end();
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

    if (req.query.cascade) {
        // If the user specified a cascading delete, delete related sections as well
        let batchRequests = {
            'courses': [{ DeleteRequest: { Key: { uid, cid } } }]
        };

        // Fetch all sections related to this course
        const relevantSections = await dynamoUtils.pagination.scan({
            TableName: 'sections',
            ExpressionAttributeValues: { ':uid': uid, ':cid': cid },
            FilterExpression: 'uid = :uid and cid = :cid'
        });

        if (relevantSections.length > 0) {
            // Add them to the batch requests
            batchRequests['sections'] = relevantSections.map(section => {
                return { 
                    DeleteRequest: {
                        Key: _.pick(section, ['uid', 'secid'])
                    } 
                }
            })
        }
    
        // Make the paginated delete call
        await dynamoUtils.pagination.batchWrite({ RequestItems: batchRequests });
    } else {
        // Otherwise, just delete the course alone
        await dynamo.delete({
            TableName: 'courses',
            Key: { uid, cid }
        }).promise();
    }

    res.end();
}

module.exports = {
    getAll,
    create,
    update,
    delete: del
}