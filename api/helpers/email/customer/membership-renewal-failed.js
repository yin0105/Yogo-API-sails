const moment = require('moment');
const currencyDkk = require('../../../filters/currency_dkk');

module.exports = {

  friendlyName: 'Customer email: Membership renewal failed',

  description: 'Send an email to the customer when the automatic membership payment fails',

  inputs: {
    membership: {
      type: 'ref',
      description: 'The membership where payment failed. Can be id or object.',
      required: true,
    },
  },

  fn: async (inputs, exits) => {

    const cronLog = sails.helpers.cron.log;

    await cronLog('sending membership renewal failed email');

    const membership = await Membership.findOne(sails.helpers.util.idOrObjectIdInteger(inputs.membership))
      .populate('user')
      .populate('client')
      .populate('membership_type')
      .populate('payment_subscriptions', {archived: false, status: 'active'})
      .populate('payment_option');

    const link = await sails.helpers.webapps.getLink(membership.client, '/membership/' + membership.id);

    const clientSettings = await sails.helpers.clientSettings.find(
      membership.client.id,
      [
        `membership_payment_failed_${membership.renewal_failed}_email_subject`,
        `membership_payment_failed_${membership.renewal_failed}_email_body`,
        `membership_payment_failed_no_payment_method_${membership.renewal_failed}_email_subject`,
        `membership_payment_failed_no_payment_method_${membership.renewal_failed}_email_body`,
        'invoice_email_additional_recipients',
        'email_bcc_to_client_on_membership_renewal_failed',
      ],
    );

    let
      subjectTemplate,
      bodyTemplate;

    if (membership.payment_subscriptions.length) {
      subjectTemplate = clientSettings[`membership_payment_failed_${membership.renewal_failed}_email_subject`];
      bodyTemplate = clientSettings[`membership_payment_failed_${membership.renewal_failed}_email_body`];
      await cronLog('renewal failed because payment was declined');
    } else {
      subjectTemplate = clientSettings[`membership_payment_failed_no_payment_method_${membership.renewal_failed}_email_subject`];
      bodyTemplate = clientSettings[`membership_payment_failed_no_payment_method_${membership.renewal_failed}_email_body`];
      await cronLog('renewal failed because there are no payment methods');
    }

    const [subject, body] = await sails.helpers.string.fillInVariables(
      [subjectTemplate, bodyTemplate],
      {
        membership_name: membership.membership_type.name,
        update_membership_payment_method_link: link,
        membership_renewal_date: moment(membership.paid_until).add(1, 'day').format('dddd [d]. D. MMMM YYYY'),
        membership_payment_amount: currencyDkk(membership.payment_option.payment_amount),
      },
      {
        customer: membership.user,
        studio: membership.client,
      },
    );

    await cronLog('Sending email with these parameters: ' + JSON.stringify({
      user: membership.user,
      subject: subject,
      text: body,
      blindCopyToClient: clientSettings.email_bcc_to_client_on_membership_renewal_failed,
      emailType: 'membership_renewal_failed',
    }));

    await sails.helpers.email.send.with({
      user: membership.user,
      subject: subject,
      text: body,
      blindCopyToClient: clientSettings.email_bcc_to_client_on_membership_renewal_failed,
      emailType: 'membership_renewal_failed',
    });

    return exits.success();

  },

};
