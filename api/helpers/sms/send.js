module.exports = {
  friendlyName: 'Send SMS',

  inputs: {
    user: {
      type: 'ref',
      required: true,
    },
    message: {
      type: 'string',
      required: true,
    },
    type: {
      type: 'string',
      isIn: [
        'class_cancelled',
        'customer_moved_from_waiting_list_to_class',
        'teacher_notification_customer_signed_up_for_private_class',
        'teacher_notification_customer_signed_off_from_private_class',
      ],
      required: true,
    },
  },

  fn: async (inputs, exits) => {

    const user = await sails.helpers.util.objectFromObjectOrObjectId(inputs.user, User);
    const clientId = sails.helpers.util.idOrObjectIdInteger(user.client_id || user.client);

    const smsLogger = sails.helpers.logger('sms');
    smsLogger.info('sms.send: user: ' + user.id + ', type: ' + inputs.type + ', message: ' + inputs.message);

    if (!user.phone.match(/^\d{8}$/)) {
      smsLogger.info('Invalid phone number on user ' + user.id + ': ' + user.phone);
      return exits.success();
    }

    let msisdn = '45' + user.phone;


    const smsDbItem = await Sms.create({
      client: clientId,
      user: user.id,
      type: inputs.type,
      message: inputs.message,
      msisdn: msisdn,
    }).fetch();

    const smsSenderName = await sails.helpers.clientSettings.find(user.client_id || user.client, 'sms_sender_name');

    //
    // Safety
    //
    msisdn = sails.config.sms.sendRealSms ?
      msisdn :
      sails.config.sms.sendAllSmsToMsisdn;

    const response = await sails.helpers.sms.transport.gatewayApi.with({
      message: inputs.message,
      sender: smsSenderName,
      msisdn: msisdn,
    })
      .tolerate('sendFailed', errorResponse => {
        smsLogger.error('Error user: ' + user.id);
        smsLogger.error(errorResponse);
        exits.success();
        return null;
      });

    if (response === null) {
      return; // Send failed
    }

    smsLogger.info('User ' + user.id + ' sms SENT!!');

    await Sms.update({id: smsDbItem.id}, {
      sms_provider_id: response.ids[0],
      sms_provider_total_cost: response.usage.total_cost,
      sms_provider_currency: response.usage.currency,
    });

    return exits.success();
  },
};
