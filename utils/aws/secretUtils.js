const { secrets } = require('./index');

async function get(secretId) {
    const secretValue = await secrets.getSecretValue({ SecretId: secretId }).promise();
    return JSON.parse(secretValue.SecretString);
}

module.exports = {
    get
}