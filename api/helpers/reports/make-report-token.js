const jwt = require('../../services/jwTokens')

module.exports = {

  friendlyName: 'Make file token',

  description: 'Creates a JWT with report params and additional security params.',

  inputs: {

    reportParams: {
      type: 'ref',
      description: 'The parameters to generate the report',
      required: true,
    },

    req: {
      type: 'ref',
      description: 'The current incoming request',
      required: true,
    },

  },

  fn: async (inputs, exits) => {

    const ip = inputs.req.ip

    const token = jwt.issue(
      {
        report: inputs.reportParams,
        ip: ip,
      },
      60,
    )

    return exits.success(token)

  },

}
