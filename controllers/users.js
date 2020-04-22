const _ = require('lodash');
const uuid = require('uuid/v1');
const joi = require('@hapi/joi');
const dynamo = require('../utils/aws').dynamo;
const validation = require('../utils/validation')

async function getMe(req, res) {
    const uid = req.user;
    const user = await dynamo.get({
        TableName: 'users',
        Key: { id: uid }
    }).promise();
    res.json(user.Item).end();
}

async function create(req, res) {
    validation.check(req.body, joi.object({
        email: joi.string().email().required(),
        name: joi.string().required()
    }));

    const { email, name } = req.body;
    
    const uid = uuid();

    // Check if the user already exists
    const existingCheck = await dynamo.scan({
        TableName: 'users',
        ExpressionAttributeValues: { ':email': email },
        FilterExpression: 'email = :email'
    }).promise();

    if (existingCheck.Items.length > 0) throw new Error(`User with this email already exists`);

    const user = { id: uid, email, name };

    await dynamo.put({
        TableName: 'users',
        Item: user
    }).promise();

    res.json(user).end();
}

async function doDelete(uid, tableName, attributeValue) {
    let hasMore = false;

    do {
        const query = await dynamo.query({
            TableName: tableName,
            ExpressionAttributeValues: { ':uid': uid },
            KeyConditionExpression: 'uid = :uid',
        }).promise();

        let items = query.Items;
        if (items.length == 0) break;
        else if (items.length > 25) {
            items = items.slice(0, 25);
        }

        const batch = await dynamo.batchWrite({
            RequestItems: {
                [tableName]: items.map(el => {
                    return {
                        DeleteRequest: {
                            Key: {
                                uid,
                                [attributeValue]: el[attributeValue]
                            }
                        }
                    }
                })
            }
        }).promise();

        hasMore = (!!query.LastEvaluatedKey || query.Items.length > 25 || _.keys(batch.UnprocessedItems).length > 0);
    } while (hasMore);
}

async function clean(req, res) {
    const uid = req.user;

    let hasMore = false;

    await doDelete(uid, 'semesters', 'sid');
    await doDelete(uid, 'courses', 'cid');
    await doDelete(uid, 'sections', 'secid');
    await doDelete(uid, 'assignments', 'aid');
    await doDelete(uid, 'tasks', 'tid');

    res.end();
}

module.exports = {
    getMe,
    create,
    clean
};