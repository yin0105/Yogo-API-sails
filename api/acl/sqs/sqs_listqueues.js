// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');
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

var params = {};

sqs.listQueues(params, function(err, data) {
  if (err) {
    console.log("Error", err);
  } else {
    console.log("Success", data.QueueUrls);
  }
});

/**
 * {
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
}
 */