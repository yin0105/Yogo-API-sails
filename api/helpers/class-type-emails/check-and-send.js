const ClassSignupObj = require('../../objection-models/ClassSignup');
const ClassWaitingListSignupObj = require('../../objection-models/ClassWaitingListSignup');
const ClassLivestreamSignupObj = require('../../objection-models/ClassLivestreamSignup');

module.exports = {
  friendlyName: 'Check and send class type email for signups and cancelled bookings',

  inputs: {
    signup: {
      type: 'ref',
      required: true,
    },
    modelName: {
      type: 'string',
      isIn: ['ClassSignup', 'ClassWaitingListSignup', 'ClassLivestreamSignup'],
      required: true,
    },
    event: {
      type: 'string',
      isIn: ['signup', 'cancel_booking'],
      required: true,
    },
  },

  fn: async (inputs, exits) => {

    const signupId = sails.helpers.util.idOrObjectIdInteger(inputs.signup);
    let objectionModel;
    switch (inputs.modelName) {
      case 'ClassSignup':
        objectionModel = ClassSignupObj;
        break;
      case 'ClassLivestreamSignup':
        objectionModel = ClassLivestreamSignupObj;
        break;
      case 'ClassWaitingListSignup':
        objectionModel = ClassWaitingListSignupObj;
        break;
    }
    const signup = await objectionModel.query()
      .where({
        id: signupId,
      })
      .first()
      .eager({
        'class': {
          class_type: true,
        },
        user: true,
      });

    const classTypeEmailQuery = knex({cte: 'class_type_email'})
      .innerJoin({ctect: 'class_type_email_class_type'}, 'cte.id', 'ctect.class_type_email_id')
      .innerJoin({ct: 'class_type'}, 'ctect.class_type_id', 'ct.id')
      .where({
        'cte.archived': 0,
        'cte.send_at': inputs.event,
        'ct.archived': 0,
        'ct.id': signup.class.class_type.id,
      })
      .select('cte.*');

    switch (inputs.modelName) {
      case 'ClassSignup':
        classTypeEmailQuery.andWhere('cte.send_to_signups', 1);
        break;
      case 'ClassWaitingListSignup':
        classTypeEmailQuery.andWhere('cte.send_to_waiting_list', 1);
        break;
      case 'ClassLivestreamSignup':
        classTypeEmailQuery.andWhere('cte.send_to_livestream_signups', 1);
        break;
    }

    const classTypeEmails = await classTypeEmailQuery;

    if (!classTypeEmails.length) return exits.success();

    const logger = sails.helpers.logger('class-type-notification-emails');

    const locale = await sails.helpers.clientSettings.find(classTypeEmails[0].client_id, 'locale');

    for (let i = 0; i < classTypeEmails.length; i++) {
      const classTypeEmail = classTypeEmails[i];
      const [subject, body] = await sails.helpers.string.fillInVariables(
        [classTypeEmail.subject, classTypeEmail.body],
        {},
        {
          customer: signup.user.id,
          studio: classTypeEmail.client_id,
          class: signup.class,
        },
        locale,
      );

      logger.info(`Sending class type email (${inputs.event}) ${classTypeEmail.id} with subject ${classTypeEmail.subject} to user ${signup.user.id} for class ${signup.class.id}, ${signup.class.date} ${signup.class.start_time}`);
      await sails.helpers.email.send.with({
        user: signup.user.id,
        subject: subject,
        text: body,
        emailType: 'class_type_email',
        classId: signup.class.id,
        classTypeEmailId: classTypeEmail.id,
      });
    }

    return exits.success();

  },
};
