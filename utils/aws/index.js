const AWS = require('aws-sdk');
AWS.config.region = 'us-west-2';

module.exports = {
    AWS,
    dynamo: new AWS.DynamoDB.DocumentClient(),
    secrets: new AWS.SecretsManager()
};