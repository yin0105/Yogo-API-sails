module.exports = {
  friendlyName: 'ICS_URL',

  description: 'Populates an array of classes with ics_url, which is the url for an ics file wth calendar info for the class.',

  inputs: {
    classes: {
      type: 'ref',
      description: 'An array of classes. It will both be mutated and returned.',
      required: true
    },
  },

  sync: true,

  fn: function(inputs, exits) {
    _.each(inputs.classes, classItem => {

      const clientId = sails.helpers.util.idOrObjectIdInteger(classItem.client_id || classItem.client)

      classItem.ics_url = sails.config.baseUrl + '/classes/' + classItem.id + '/ics?client=' + clientId

    })

    return exits.success(inputs.classes)
  }

}
