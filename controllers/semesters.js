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
    const semesters = await dynamoUtils.pagination.query({
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

async function del(req, res) {
    validation.check(req.body, joi.object({ 
        uid: joi.string(),
        sid: joi.string().required()
    }));

    const uid = req.user;
    const sid = req.body.sid;

    if (!req.query.cascade) {
        await dynamo.delete({
            TableName: 'semesters',
            Key: { uid, sid }
        }).promise();
    } else {
        let batchRequests = {
            'semesters': [{ DeleteRequest: { Key: { uid, sid } } }]
        };

        const courses = await dynamoUtils.pagination.scan({
            TableName: 'courses',
            ExpressionAttributeValues: { ':uid': uid, ':sid': sid },
            FilterExpression: 'uid = :uid and sid = :sid'
        });

        if (courses.length > 0) {
            batchRequests['courses'] = courses.map(course => {
                return {
                    DeleteRequest: {
                        Key: _.pick(course, ['uid', 'cid'])
                    }
                }
            });

            const sections = [];

            for (const course of courses) {
                sections.push(...(await dynamoUtils.pagination.scan({
                    TableName: 'sections',
                    ExpressionAttributeValues: { ':uid': uid, ':cid': course.cid },
                    FilterExpression: 'uid = :uid and cid = :cid'
                })));
            }

            if (sections.length > 0) {
                batchRequests['sections'] = sections.map(section => {
                    return { 
                        DeleteRequest: {
                            Key: _.pick(section, ['uid', 'secid'])
                        } 
                    }
                });
            }
        }

        // Make the paginated delete call
        await dynamoUtils.pagination.batchWrite({ RequestItems: batchRequests });
    }

    res.end();
}

module.exports = {
    getAll,
    create,
    update,
    delete: del
}