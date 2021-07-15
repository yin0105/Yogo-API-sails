module.exports = {
  friendlyName: 'Get frontend link',

  inputs: {
    client: {
      type: 'ref',
      required: true
    },
    path: {
      type: 'string',
      required: true
    },
    webapp: {
      type: 'string',
      defaultsTo: 'frontend'
    }
  },

  fn: async (inputs, exits) => {

    const clientId = sails.helpers.util.idOrObjectIdInteger(inputs.client);

    const domains = await Domain.find({client: clientId});
    const domainName = domains[0].name;
    const protocol = _.includes(domainName, 'localhost') || _.includes(domainName, '.local') ? 'http' : 'https';

    const link = `${protocol}://${domains[0].name}/${inputs.webapp}/index.html#${inputs.path}`;

    return exits.success(link);

  }
}
