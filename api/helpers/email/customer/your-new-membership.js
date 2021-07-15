const moment = require('moment-timezone');
const currencyDkk = require('../../../filters/currency_dkk');

module.exports = {
  friendlyName: 'Your new membership',

  inputs: {
    membership: {
      type: 'ref',
      required: true,
    },
  },

  fn: async (inputs, exits) => {

    const membershipId = sails.helpers.util.idOrObjectIdInteger(inputs.membership);

    const membership = await Membership.findOne(membershipId)
      .populate('user')
      .populate('client')
      .populate('membership_type')
      .populate('payment_option');

    const membershipEditLink = await sails.helpers.webapps.getLink(membership.client, '/membership/' + membershipId);

    const subjectTemplate = membership.membership_type.email_subject;
    const bodyTemplate = membership.membership_type.email_body;

    const locale = await sails.helpers.clientSettings.find(membership.client, 'locale')

    const [subject, body] = await sails.helpers.string.fillInVariables(
      [subjectTemplate, bodyTemplate],
      {
        membership_edit_link: membershipEditLink,
        membership_name: membership.membership_type.name,
        membership_paid_until_date: sails.helpers.util.formatDate(membership.paid_until, locale),
        membership_renewal_date: sails.helpers.util.formatDate(moment(membership.paid_until).add(1, 'day'), locale),
        membership_payment_amount: currencyDkk(membership.payment_option.payment_amount),
      },
      {
        customer: membership.user,
        studio: membership.client,
      },
    );

    // SEND THE EMAIL
    await sails.helpers.email.send.with({
      user: membership.user,
      subject: subject,
      text: body,
      emailType: 'your_new_membership',
    });

    return exits.success();

  },
};
