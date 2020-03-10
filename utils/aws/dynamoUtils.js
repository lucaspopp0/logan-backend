const _ = require('lodash');
const dynamo = require('./index').dynamo;

async function makePaginatedScan(params) {
    let results = [];
    let paginatedParams = _.assign({}, params);
    let hasMore = false;

    do {
        let response = await dynamo.scan(paginatedParams).promise();
        results.push(...response.Items);
        hasMore = !!response.LastEvaluatedKey;
        paginatedParams = _.assign({}, params, { ExclusiveStartKey: response.LastEvaluatedKey });
    } while (hasMore);

    return results;
}

async function makePaginatedQuery(params) {
    let results = [];
    let paginatedParams = _.assign({}, params);
    let hasMore = false;

    do {
        let response = await dynamo.query(paginatedParams).promise();
        results.push(...response.Items);
        hasMore = !!response.LastEvaluatedKey;
        paginatedParams = _.assign({}, params, { ExclusiveStartKey: response.LastEvaluatedKey });
    } while (hasMore);

    return results;
}

async function makePaginatedBatchWrite(params) {
    let pendingRequests = params.RequestItems;

    let response;
    do {
        response = await dynamo.batchWrite({ RequestItems: pendingRequests }).promise();
        pendingRequests = response.UnprocessedItems;
    } while (_.keys(pendingRequests).length > 0);
}

module.exports = {
    pagination: {
        query: makePaginatedQuery,
        scan: makePaginatedScan,
        batchWrite: makePaginatedBatchWrite
    }
};