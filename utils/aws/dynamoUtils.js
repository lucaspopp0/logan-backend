const _ = require('lodash');
const dynamo = require('./index').dynamo;

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

module.exports = {
    makePaginatedQuery
};