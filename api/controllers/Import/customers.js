const ObjectionUser = require('../../objection-models/User');
const moment = require('moment-timezone');
const {v4: uuidv4} = require('uuid');
// Note: Don't use native .map/.find. Use lodash _.map/_.find

module.exports = async (req, res) => {

  let newCustomers = req.body.customers;

  const newCustomerEmails = _.map(newCustomers, 'email');

  const existingUsers = await User.find({
    archived: false,
    email: newCustomerEmails,
    client: req.client.id,
  });

  if (existingUsers.length) {
    const existingEmails = _.map(existingUsers, 'email');
    return res.badRequest('Existing email(s): ' + existingEmails.join(', '));
  }

  // TODO: (Maybe) Check that class pass types etc exist

  await sails.helpers.clientSettings.update(req.client.id, {pause_automatic_membership_payments: true});

  const nowTimestamp = (new Date()).getTime();

  const monthlyMembershipTypePaymentOptions = await MembershipTypePaymentOption.find({
    membership_type: {'>': 0},
    client: req.client.id,
    number_of_months_payment_covers: 1,
  });

  newCustomers = _.map(newCustomers, (newCustomer, newCustomerIdx) => {

    const dibsTicketId = newCustomer.dibsTicketId;

    newCustomer = _
      .chain(newCustomer)
      .pick([
        'first_name',
        'last_name',
        'address_1',
        'address_2',
        'zip_code',
        'city',
        'country',
        'email',
        'phone',
        'date_of_birth',
        'class_passes',
        'class_signups',
        'event_signups',
        'memberships',
        'id_in_previous_booking_system',
      ])
      .assign({
        '#id': 'newCustomerIdx_' + newCustomerIdx,
        client: req.client.id,
        customer: 1,
        archived: 0,
        createdAt: newCustomer.profile_created ? parseInt(moment.tz(newCustomer.profile_created, 'Europe/Copenhagen').format('x')) : nowTimestamp,
        updatedAt: nowTimestamp,
        email_confirmed: 1,
        import_welcome_set_password_email_sent: 0,
        teacher_ical_token: uuidv4(),
        teacher_can_manage_all_classes: 0,
      })
      .value();

    newCustomer.class_passes = _.map(newCustomer.class_passes, (newClassPass, newClassPassIdx) => {

      const refId = 'newCustomerIdx_' + newCustomerIdx + '_newClassPassIdx_' + newClassPassIdx;

      newClassPass = _
        .chain(newClassPass)
        .pick([
          'classes_left',
          'start_date',
          'valid_until',
        ])
        .assign({
          class_pass_type: {
            id: newClassPass.class_pass_type,
          },
          client: req.client.id,
          "#id": refId,
          archived: 0,
          createdAt: nowTimestamp,
          updatedAt: nowTimestamp,
          ad_hoc_task_status: '',
          log_entries: [{
            createdAt: nowTimestamp,
            updatedAt: nowTimestamp,
            archived: 0,
            client_id: req.client.id,
            user: {
              "#ref": 'newCustomerIdx_' + newCustomerIdx,
            },
            entry: 'Adgangskort importeret fra andet system',
          }],
        })
        .value();

      return newClassPass;
    });


    newCustomer.memberships = _.map(newCustomer.memberships, (newMembership, newMembershipIdx) => {
      const refId = 'newCustomerIdx_' + newCustomerIdx + '_newMembershipIdx_' + newMembershipIdx;

      const paymentOptionId = _.find(
        monthlyMembershipTypePaymentOptions,
        paymentOption => parseInt(paymentOption.membership_type) === parseInt(newMembership.membership_type),
      ).id;

      newMembership = _
        .chain(newMembership)
        .pick([
          'start_date',
          'paid_until',
        ])
        .assign({
          membership_type: {
            id: newMembership.membership_type,
          },
          client: req.client.id,
          "#id": refId,
          archived: 0,
          createdAt: nowTimestamp,
          updatedAt: nowTimestamp,
          status: 'active',
          renewal_failed: 0,
          renewal_failed_last_time_at: 0,
          real_user_is_someone_else: 0,
          real_user_name: '',
          early_warning_for_missing_subscription_sent: 0,
          warning_for_missing_subscription_on_payment_due_sent: 0,
          automatic_payment_processing_started: 0,
          membership_campaign_number_of_reduced_payments_left: 0,
          ad_hoc_task_status: '',
          payment_subscriptions: dibsTicketId ?
            [
              {
                createdAt: nowTimestamp,
                updatedAt: nowTimestamp,
                archived: 0,
                client: req.client.id,
                payment_service_provider: 'dibs',
                payment_provider_subscription_id: dibsTicketId,
                status: 'active',
                pay_type: '',
                card_last_4_digits: '',
                card_expiration: '',
                card_nomask: '',
                card_prefix: '',
                customer_notified_of_error: 0,
              },
            ] :
            [],
          payment_option: {
            id: paymentOptionId,
          },
          log_entries: [{
            createdAt: nowTimestamp,
            updatedAt: nowTimestamp,
            archived: 0,
            client: req.client.id,
            userRelation: {
              "#ref": 'newCustomerIdx_' + newCustomerIdx,
            },
            entry: 'Medlemskab importeret fra andet system',
          }],
        })
        .value();

      return newMembership;
    });


    newCustomer.class_signups = _.map(newCustomer.class_signups, newSignup => {

      let usedClassPassIdx = null;
      if (newSignup.accessObjectId && newSignup.accessObjectId.substr(0, 16) === 'class_pass_type_') {
        const classPassId = newSignup.accessObjectId.substr(16);
        usedClassPassIdx = _.findIndex(newCustomer.class_passes, classPass => parseInt(classPass.class_pass_type.id) === parseInt(classPassId));
      }
      if (usedClassPassIdx === -1) {
        return res.badRequest('Signup with a non-existing class pass. Customer: ' + newCustomer.email);
      }
      let usedMembershipIdx = null;
      if (newSignup.accessObjectId && newSignup.accessObjectId.substr(0, 16) === 'membership_type_') {
        const membershipId = newSignup.accessObjectId.substr(16);
        usedMembershipIdx = _.findIndex(newCustomer.memberships, membership => parseInt(membership.membership_type.id) === parseInt(membershipId));
      }
      if (usedMembershipIdx === -1) {
        return res.badRequest('Signup with a non-existing membership. Customer: ' + newCustomer.email);
      }
      newSignup = _
        .chain(newSignup)
        .pick([
          'class', // Get rid of non-db attributes
        ])
        .assign({
          class: {
            id: newSignup.class,
          },
          client: {
            id: req.client.id,
          },
          used_class_pass: usedClassPassIdx === null ? null : {
            "#ref": 'newCustomerIdx_' + newCustomerIdx + '_newClassPassIdx_' + usedClassPassIdx,
          },
          used_membership: usedMembershipIdx === null ? null : {
            "#ref": 'newCustomerIdx_' + newCustomerIdx + '_newMembershipIdx_' + usedMembershipIdx,
          },
          archived: 0,
          cancelled_at: 0,
          createdAt: nowTimestamp,
          updatedAt: nowTimestamp,
        })
        .value();


      return newSignup;
    });


    newCustomer.event_signups = _.map(newCustomer.event_signups, newEventSignup => ({
      event: {
        id: newEventSignup.event,
      },
      client: req.client.id,
      archived: 0,
      createdAt: nowTimestamp,
      updatedAt: nowTimestamp,
    }));


    return newCustomer;

  });

  await ObjectionUser
    .query()
    .insertGraph(newCustomers, {
      relate: [
        'class_passes.class_pass_type',
        'memberships.membership_type',
        'memberships.payment_option',
        'class_signups.class',
        'class_signups.client',
        'event_signups.event',
      ],
    });

  return res.ok();

};
