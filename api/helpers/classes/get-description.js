module.exports = {
  friendlyName: 'Get class description',

  inputs: {
    class: {
      type: 'ref',
      required: true,
    },
  },

  fn: async (inputs, exits) => {

    const classId = sails.helpers.util.idOrObjectIdInteger(inputs.class);
    const classObj = await Class.findOne(classId).populate('class_type');
    const locale = await sails.helpers.clientSettings.find(classObj.client_id || classObj.client, 'locale');
    const formattedClassDate = sails.helpers.util.formatDate(classObj.date, locale);
    const classDescription = `${classObj.class_type.name}, ${formattedClassDate} ${classObj.start_time.substr(0, 5)}`;
    return exits.success(classDescription);

  },
};
