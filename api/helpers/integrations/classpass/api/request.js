const API_ROOT = 'https://sandbox-api.classpass.com'

const request = require('request-promise')
const errors = require('request-promise/errors')

// const AWS = require('aws-sdk');
// console.log("sqs = ", sails.config.sqs);
// console.log("sqs.region = ", sails.config.sqs.region);
// const AWSRegion = sails.config.sqs.region;

// AWS.config.update({region: AWSRegion});

// const sqsPolicy = sails.config.sqs.policy;
// const sqs = new AWS.SQS(sqsPolicy);


module.exports = {
  friendlyName: 'Call the ClassPass API',

  inputs: {
    method: {
      type: 'string',
      isIn: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      required: true,
    },
    endpoint: {
      type: 'string',
      required: true,
    },
    body: {
      type: 'json',
      required: false,
    },
    accessToken: {
      type: 'string',
      required: false,
      description: 'Needed for accessing private client data'
    },
  },

  exits: {
    unauthorized: {}
  },

  fn: async (inputs, exits) => {   
    const accessToken = inputs.accessToken || (sails.config.integrations.classpass_com.classpass_com_access_token)
    console.log("token = ", sails.config.integrations.classpass_com.classpass_com_access_token);
    console.log("token = ", accessToken);

    const requestOptions = {
      method: inputs.method,
      url: API_ROOT + inputs.endpoint,
      headers: {
        'content-type': 'application/json',
        Authorization: `Token ${accessToken}`,
      },
      json: true,
      body: inputs.body,      
    }

    request(requestOptions)
      .then(response => {
        return exits.success(response)
      })
      .catch(e => {
        console.log("e ========== ", e);
        console.log("e.message ========== ", e.message);
        console.log("jj = ", e.message.substr(e.message.indexOf("{")));
        let errorMessage = JSON.parse(e.message.substr(e.message.indexOf("{")));
        if (errorMessage.error) {
          console.log("errorMessage.error = ", errorMessage.error);
          errorMessage = errorMessage.error;
        }
        console.log("errorMessage = ", errorMessage);
        return exits.success(errorMessage);
      })

  },
}