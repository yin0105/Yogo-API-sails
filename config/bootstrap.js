/**
 * Bootstrap
 * (sails.config.bootstrap)
 *
 * An asynchronous bootstrap function that runs just before your Sails app gets lifted.
 * > Need more flexibility?  You can also do this by creating a hook.
 *
 * For more information on bootstrapping your app, check out:
 * https://sailsjs.com/config/bootstrap
 */

var matchPattern = require('lodash-match-pattern');

module.exports.bootstrap = function (done) {


  // By convention, this is a good place to set up fake data during development.
  //
  // For example:
  // ```
  // // Set up fake development data (or if we already have some, avast)
  // if (await User.count() > 0) {
  //   return done();
  // }
  //
  // await User.createEach([
  //   { emailAddress: 'ry@example.com', fullName: 'Ryan Dahl', },
  //   { emailAddress: 'rachael@example.com', fullName: 'Rachael Shaw', },
  //   // etc.
  // ]);
  // ```

  // Don't forget to trigger `done()` when this bootstrap function's logic is finished.
  // (otherwise your server will never lift, since it's waiting on the bootstrap)

  const checkConfigResult = matchPattern(
    sails.config,
    `{
      AWS_S3_IMAGE_UPLOAD_ACCESS_KEY_ID: _.isString,
      AWS_S3_IMAGE_UPLOAD_ACCESS_KEY_SECRET: _.isString,
      AWS_S3_IMAGE_UPLOAD_BUCKET: _.isString,
      IMAGE_SERVER: _.isString,
    
      email: {            
        mailgun: {
          apiKey: _.isString,
          domain: _.isString,
          webhookSigningKey: _.isString,
          host: _.isString,
          ...
        },
        ...    
      },
    
      sms: {            
        gatewayApi: {
          apiKey: _.isString,
          apiSecret: _.isString,
          ...          
        },
        ...
      },
    
      aws_cloudwatch_log: {
        prefix: _.isString,
        accessKeyId: _.isString,
        accessKeySecret: _.isString,
        region: _.isString
      },
    
      baseUrl: _.isString,        
    
      imgixServer: _.isString,
    
      paymentProviders: {
        dibs: {
          ticketAuthUrl: _.isString,
        },
        ...
      },
    
      integrations: {
        vimeo: {
          clientId: _.isString,
          clientSecret: _.isString
        },
        ...        
      },
    
      fmLiveswitch: {
        gatewayURL: _.isString,
        applicationId: _.isString,
        sharedSecret: _.isString,
        webhookSecret: _.isString,
        maxConnectionsPerSession: /^\\d+$/
      },
      
      ...
    }`
  );

  if (checkConfigResult) {
    throw new Error(checkConfigResult)
  }

  /*const requiredGlobalVarNames = [
    'sails.config.paymentProviders.dibs.ticketAuthUrl',
    'sails.config.aws_cloudwatch_log.accessKeyId',
    'sails.config.aws_cloudwatch_log.accessKeySecret',
    'sails.config.aws_cloudwatch_log.region',
    'sails.config.aws_cloudwatch_log.prefix',
    'sails.config.integrations.vimeo.clientId',
    'sails.config.integrations.vimeo.clientSecret',
  ]

  _.each(requiredGlobalVarNames, requiredGlobalVarName => {
    if (!eval(requiredGlobalVarName)) {
      throw new Error('Missing global variable ' + requiredGlobalVarName)
    }
  })*/

  return done()

}
