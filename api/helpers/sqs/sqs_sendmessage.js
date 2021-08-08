// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');
// Set the region 
// Set the region 
AWS.config.update({region: 'us-east-2'});

// Create an SQS service object
var sqs = new AWS.SQS({
    "Id": "Policy1628414671189",
    "Version": "2012-10-17",
    "Statement": [
      {
        "Sid": "Stmt1628414649734",
        "Action": "sqs:*",
        "Effect": "Allow",
        "Resource": "arn:aws:sqs:us-east-2:249026561983:testYogoQueue",
        "Principal": {
          "AWS": [
            "b"
          ]
        }
      }
    ]
  });

var params = {
   // Remove DelaySeconds parameter and value for FIFO queues
  DelaySeconds: 10,
  MessageAttributes: {
    "Title": {
      DataType: "String",
      StringValue: "The Whistler"
    },
    "Author": {
      DataType: "String",
      StringValue: "John Grisham"
    },
    "WeeksOn": {
      DataType: "Number",
      StringValue: "6"
    }
  },
  MessageBody: "Information about current NY Times fiction bestseller for week of 12/11/2016.",
  // MessageDeduplicationId: "TheWhistler",  // Required for FIFO queues
  // MessageGroupId: "Group1",  // Required for FIFO queues
  QueueUrl: "https://sqs.us-east-2.amazonaws.com/249026561983/testYogoQueue"
};

sqs.sendMessage(params, function(err, data) {
  if (err) {
    console.log("Error", err);
  } else {
    console.log("Success", data.MessageId);
  }
});