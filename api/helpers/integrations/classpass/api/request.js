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
    const accessToken = inputs.accessToken || (sails.config.classpass_com.classpass_com_access_token)

    const requestOptions = {
      method: inputs.method,
      url: API_ROOT + inputs.endpoint,
      headers: {
        'content-type': 'application/json',
        Authorization: accessToken,
      },
      json: true,
      body: inputs.body,      
    }

  //   const params = {
  //     // Remove DelaySeconds parameter and value for FIFO queues
  //     DelaySeconds: 10,
  //     MessageAttributes: {
  //      "Title": {
  //        DataType: "String",
  //        StringValue: "ClassPass.com API"
  //      },
  //     //  "Author": {
  //     //    DataType: "String",
  //     //    StringValue: "John Grisham12"
  //     //  },
  //     //  "WeeksOn": {
  //     //    DataType: "Number",
  //     //    StringValue: "7"
  //     //  }
  //    },
  //    MessageBody: requestOptions,
  //    QueueUrl: sails.config.sqs.url,
  //  };

    request(requestOptions)
      .then(response => {
        return exits.success(response)
      })
      .catch(e => {
        const errorMessage = 'ClassPass API request failed. Error: ' + e.code + ' - ' + e.message
        console.log(errorMessage)
        return exits.error(new Error(errorMessage))
      })

  },
}
