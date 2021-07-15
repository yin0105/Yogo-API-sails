module.exports = {
  friendlyName: '"Your new class pass" email',

  inputs: {
    classPass: {
      type: 'ref',
      required: true,
    },
  },

  fn: async (inputs, exits) => {

    const classPassId = sails.helpers.util.idOrObjectIdInteger(inputs.classPass);

    const classPass = await ClassPass.findOne(classPassId).populate('user').populate('client').populate('class_pass_type');

    const subjectTemplate = classPass.class_pass_type.email_subject;
    const bodyTemplate = classPass.class_pass_type.email_body;

    const locale = await sails.helpers.clientSettings.find(classPass.client, 'locale')

    const [subject, body] = await sails.helpers.string.fillInVariables(
      [subjectTemplate, bodyTemplate],
      {
        class_pass_name: classPass.class_pass_type.name,
        class_pass_number_of_classes: classPass.class_pass_type.number_of_classes,
        class_pass_valid_until_date: sails.helpers.util.formatDate(classPass.valid_until, locale),
      },
      {
        customer: classPass.user,
        studio: classPass.client,
      },
    );

    // SEND THE EMAIL
    await sails.helpers.email.send.with({
      user: classPass.user,
      subject: subject,
      text: body,
      emailType: 'your_new_class_pass'
    });

    return exits.success()

  },
};
