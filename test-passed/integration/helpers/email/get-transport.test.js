const comparePartialObject = require('../../../utils/compare-partial-object')

describe('helpers.email.getTransport', async () => {

  it('should return a Nodemailer transport object for Mailgun', async () => {

    const transportObject = sails.helpers.email.getTransport()

    comparePartialObject(
      transportObject,
      {
        transporter: {
          mailgun: {
            host: 'api.mailgun.net',
          },
        },
      },
    )


  })

})
