const _ = require('lodash');

function requireQueryParams(req, params) {
    const missingParams = _.filter(params, param => (req.query[param] === undefined || req.query[param] === null));
    
    if (missingParams.length > 0) {
        throw new Error(`Missing required query parameter(s): ` + missingParams);
    } else {
        return _.pick(req.query, params);
    }
}

function requireBodyParams(req, params) {
    const missingParams = _.filter(params, param => (req.body[param] === undefined || req.body[param] === null));
    
    if (missingParams.length > 0) {
        throw new Error(`Missing required body parameter(s): ` + missingParams);
    } else {
        return _.pick(req.body, params);
    }
}

module.exports = {
    requireQueryParams,
    requireBodyParams
};