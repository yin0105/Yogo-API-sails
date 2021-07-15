const nodemailer = require('nodemailer')
const mg = require('nodemailer-mailgun-transport')


module.exports = {

  friendlyName: 'Get email transport',

  description: 'Gets a transport object for sending emails. Currently uses Mailgun and Nodemailer.',

  sync: true,

  fn: (inputs, exits) => {

    const emailTransport = nodemailer.createTransport(mg(
      {
        auth: {
          api_key: sails.config.email.mailgun.apiKey,
          domain: sails.config.email.mailgun.domain,
        },
        host: sails.config.email.mailgun.host,
      },
    ))

    return exits.success(emailTransport)

  }

}
