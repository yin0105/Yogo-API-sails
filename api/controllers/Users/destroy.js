module.exports = {

  friendlyName: 'Archive user',

  inputs: {
    id: {
      type: 'number',
      required: true,
    },
  },

  exits: {
    forbidden: {
      responseType: 'forbidden',
    },
  },

  fn: async function (inputs, exits) {

    if (!await sails.helpers.can2('controller.Users.destroy', this.req)) {
      return exits.forbidden();
    }

    const userId = inputs.id;

    const user = await User
      .findOne(userId)
      .populate('class_signups', {cancelled_at: 0, archived: false})
      .populate('class_waiting_list_signups', {cancelled_at: 0, archived: false})
      .populate('class_livestream_signups', {cancelled_at: 0, archived: false});

    for (let i = 0; i < user.class_signups.length; i++) {
      const classSignup = user.class_signups[i];
      await sails.helpers.classSignups.destroy(classSignup.id, false);
    }

    for (let i = 0; i < user.class_waiting_list_signups.length; i++) {
      const classWaitingListSignup = user.class_waiting_list_signups[i];
      await sails.helpers.classWaitingListSignups.destroy(classWaitingListSignup.id);
    }

    for (let i = 0; i < user.class_livestream_signups.length; i++) {
      const classLivestreamSignup = user.class_livestream_signups[i];
      await sails.helpers.classLivestreamSignups.destroy(classLivestreamSignup.id, false);
    }

    await Membership.update({user: userId}, {archived: true});

    await ClassPass.update({user: userId}, {archived: true});

    await EventSignup.update({user: userId}, {archived: true});

    await CartItem.destroy({user: userId});

    await Image.update({id: user.image}, {expires: Date.now()});

    await User.update({id: userId}, {
      createdAt: Date.now(),
      archived: true,
      first_name: '',
      last_name: '',
      address_1: '',
      address_2: '',
      zip_code: '',
      city: '',
      country: '',
      email: 'null@yogo.dk',
      email_confirmed: false,
      phone: '',
      date_of_birth: null,
      customer: false,
      admin: false,
      checkin: false,
      teacher: false,
      teacher_description: '',
      customer_additional_info: '',
      encrypted_password: '',
      reset_password_token: '',
      reset_password_token_expires: 0,
      id_in_previous_booking_system: '',
      import_welcome_set_password_email_sent: false,
      teacher_ical_token: '',
      image: null,
    });

    return exits.success();
  },
};
