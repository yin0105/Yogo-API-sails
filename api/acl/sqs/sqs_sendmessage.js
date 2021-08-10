// Load the AWS SDK for Node.js
const AWS = require('aws-sdk');
// Set the region 
// Set the region 
const AWSRegion = sails.config.sqs.region;
AWS.config.update({region: AWSRegion});

// Create an SQS service object
const sqsPolicy = sails.config.sqs.policy;
const sqs = new AWS.SQS(sqsPolicy);

const params = {
   // Remove DelaySeconds parameter and value for FIFO queues
  DelaySeconds: 10,
  MessageAttributes: {
    "Title": {
      DataType: "String",
      StringValue: "The Whistler12"
    },
    "Author": {
      DataType: "String",
      StringValue: "John Grisham12"
    },
    "WeeksOn": {
      DataType: "Number",
      StringValue: "7"
    }
  },
  MessageBody: "Information about current NY Times fiction bestseller for week of 08/08/2021.",
  // MessageDeduplicationId: "TheWhistler",  // Required for FIFO queues
  // MessageGroupId: "Group1",  // Required for FIFO queues
  QueueUrl: sails.config.sqs.url,
};

sqs.sendMessage(params, function(err, data) {
  if (err) {
    console.log("Error", err);
  } else {
    console.log("Success", data.MessageId);
  }
});