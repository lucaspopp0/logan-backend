const _ = require('lodash');
const uuid = require('uuid/v1');
const joi = require('@hapi/joi');
const dynamo = require('../utils/aws').dynamo;
const dynamoUtils = require('../utils/aws/dynamoUtils');
const validation = require('../utils/validation');

const ASSIGNMENT_SCHEMA = joi.object({
    uid: joi.string().required(),
    aid: joi.string().required(),
    title: joi.string().required(),
    dueDate: joi.string().required(),
    description: joi.string(),
    commitmentId: joi.string()
});

async function getAll(req, res) {
    const uid = req.user;
    const assignments = await dynamoUtils.pagination.query({
        TableName: 'assignments',
        ExpressionAttributeValues: { ':uid': uid },
        KeyConditionExpression: 'uid = :uid'
    });
    res.json(assignments).end();
}

async function create(req, res) {
    const uid = req.user;

    const assignment = _.assign({}, req.body, { aid: uuid(), uid });
    validation.check(assignment, ASSIGNMENT_SCHEMA);

    await dynamo.put({ TableName: 'assignments', Item: assignment }).promise();
    res.json(assignment).end();
}

async function update(req, res) {
    const uid = req.user;
    const assignment = _.assign({}, req.body, { uid });
    validation.check(assignment, ASSIGNMENT_SCHEMA);
    await dynamo.put({ TableName: 'assignments', Item: assignment }).promise();
    res.json(assignment).end();
}

async function del(req, res) {
    validation.check(req.body, joi.object({ 
        uid: joi.string(),
        aid: joi.string().required()
    }));

    const uid = req.user;
    const aid = req.body.aid;

    if (!req.query.cascade) {
        await dynamo.delete({
            TableName: 'assignments',
            Key: { uid, aid }
        }).promise();
    } else {
        let batchRequests = {
            'assignments': [{ DeleteRequest: { Key: { uid, aid }}}]
        }

        const relatedTasks = await dynamoUtils.pagination.scan({
            TableName: 'tasks',
            ExpressionAttributeValues: { ':uid': uid, ':raid': aid },
            FilterExpression: 'uid = :uid and relatedAid = :raid'
        });

        if (relatedTasks.length > 0) {
            batchRequests['tasks'] = relatedTasks.map(task => {
                return {
                    DeleteRequest: {
                        Key: _.pick(task, ['uid', 'tid'])
                    }
                }
            })
        }

        await dynamoUtils.pagination.batchWrite({ RequestItems: batchRequests });
    }
    
    res.end();
}

module.exports = {
    getAll,
    create,
    update,
    delete: del
};