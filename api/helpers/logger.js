const
  {createLogger, transports} = require('winston'),
  WinstonCloudwatch = require('winston-cloudwatch'),
  crypto = require('crypto')

require('winston-daily-rotate-file')

const loggers = {}

module.exports = {
  friendlyName: 'Logger',

  description: 'Get a logger for a custom log group.',

  inputs: {
    logContext: {
      type: 'string',
      required: true,
    },
  },

  sync: true,

  fn: (inputs, exits) => {

    const existingLogger = loggers[inputs.logContext]

    if (existingLogger) return exits.success(existingLogger)

    const startTime = new Date().toISOString()

    if (process.env.NODE_ENV === 'production' && sails.config.aws_cloudwatch_log) {

      loggers[inputs.logContext] = createLogger(
        {
          transports: [
            new WinstonCloudwatch({
              logGroupName: sails.config.aws_cloudwatch_log.prefix + inputs.logContext,
              logStreamName: function () {
                // Spread log streams across dates as the server stays up
                const date = new Date().toISOString().split('T')[0]
                return inputs.logContext + '-' + date + '-' +
                  crypto.createHash('md5')
                    .update(startTime)
                    .digest('hex')
              },
              awsAccessKeyId: sails.config.aws_cloudwatch_log.accessKeyId,
              awsSecretKey: sails.config.aws_cloudwatch_log.accessKeySecret,
              awsRegion: sails.config.aws_cloudwatch_log.region,
              jsonMessage: true,
            }),
          ],
        },
      )

    } else {

      const filename = 'logs/' + inputs.logContext + '/' + inputs.logContext + '-%DATE%.log'

      loggers[inputs.logContext] = createLogger(
        {
          transports: [
            new (transports.DailyRotateFile)({
              filename: filename,
              maxFiles: '14d',
            }),
          ],
        },
      )

    }

    return exits.success(loggers[inputs.logContext])

  },

}
