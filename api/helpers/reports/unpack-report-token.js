const jwToken = require('../../services/jwTokens')

module.exports = {

  friendlyName: 'Unpack file token',

  description: 'Checks that the file token is valid and returns the payload. Returns false if token is invalid.',

  inputs: {

    token: {
      type: 'string',
      description: 'The report token to verify and unpack',
      required: true,
    },

    req: {
      type: 'ref',
      description: 'The current req object',
      required: true,
    },

  },

  fn: async (inputs, exits) => {

    jwToken.verify(inputs.token, (err, payload) => {
      if (err) {
        return exits.success(false)
      }
      if (payload.ip !== inputs.req.ip) {
        return exits.success(false)
      }

      return exits.success(payload.report)
    })

  },

}
