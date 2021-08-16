const supertest = require('supertest');

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID;
const fixtures = require('../../../fixtures/factory').fixtures;
const {authorizeAdmin, authorizeUserBill} = require('../../../utils/request-helpers');

describe('controllers.Users.destroy', () => {

  before(async () => {

  });

  after(async () => {

  });


  it('should return an error if the current user is not admin', async () => {

    await supertest(sails.hooks.http.app)
      .delete(
        '/users/' + fixtures.userAlice.id + '?client=' + testClientId)
      .expect(403);

    await supertest(sails.hooks.http.app)
      .delete(
        '/users/' + fixtures.userAlice.id + '?client=' + testClientId)
      .use(authorizeUserBill())
      .expect(403);

  });

  it('should return an error if the user is on another client', async () => {

    const userOnAnotherClient = await User.create({
      client: testClientId + 1,
      email: 'testUserOnAnotherClient@yogo.dk',
    }).fetch();

    await supertest(sails.hooks.http.app)
      .delete('/users/' + userOnAnotherClient.id + '?client=' + testClientId)
      .expect(403);

    await User.destroy({id: userOnAnotherClient.id});

  });

  it('should archive and anonymize user, archive memberships, class passes, signups and delete teacher relations and cart items', async () => {

    const userToDestroy = await User.create({
      client: testClientId,
      first_name: 'First name',
      last_name: 'Last name',
      address_1: 'Address 1',
      address_2: 'Address 2',
      zip_code: 'Zip code',
      city: 'City',
      country: 'DK',
      phone: '5555-5555',
      email: 'testUser@yogo.dk',
      email_confirmed: true,
      date_of_birth: '2020-01-01',
      customer: true,
      admin: true,
      checkin: true,
      teacher: true,
      teacher_description: 'Teacher description',
      customer_additional_info: 'Customer additional info',
      encrypted_password: '1234567890ABCDEF',
      reset_password_token: 'abcdefg',
      reset_password_token_expires: 123456,
      id_in_previous_booking_system: 'PreviousID',
      import_welcome_set_password_email_sent: true,
      teacher_ical_token: 'TeacherICALToken',
      image: fixtures.image1.id,
      teacher_can_manage_all_classes: false,
      livestream_time_display_mode: 'remaining'
    }).fetch();

    const classObj = await Class.create({
      date: '2020-01-01',
      start_time: '12:00:00',
      end_time: '14:00:00',
      class_type: fixtures.classTypeYoga.id,
      client: testClientId,
      teachers: [userToDestroy.id],
    }).fetch();

    const eventObj = await Event.create({
      client: testClientId,
      start_date: '2020-01-01',
      teachers: [userToDestroy.id],
    }).fetch();

    await ClassSignup.create({
      client: testClientId,
      user: userToDestroy.id,
      class: classObj.id,
    });

    await ClassWaitingListSignup.create({
      client: testClientId,
      user: userToDestroy.id,
      class: classObj.id,
    });

    await ClassLivestreamSignup.create({
      client: testClientId,
      user: userToDestroy.id,
      class: classObj.id,
    });

    await EventSignup.create({
      client: testClientId,
      user: userToDestroy.id,
      event: eventObj.id,
    });

    await Membership.create({
      client: testClientId,
      user: userToDestroy.id,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
      status: 'active',
    });

    await ClassPass.create({
      client: testClientId,
      user: userToDestroy.id,
      class_pass_type: fixtures.classPassTypeYogaTenClasses.id,
    });

    await CartItem.create({
      client: testClientId,
      user: userToDestroy.id,
      item_type: 'class_pass_type',
      item_id: fixtures.classPassTypeDanceTenClasses.id,
    });

    const timeBeforeDestroy = Date.now();

    await supertest(sails.hooks.http.app)
      .delete('/users/' + userToDestroy.id + '?client=' + testClientId)
      .use(authorizeAdmin())
      .expect(200);

    const timeAfterDestroy = Date.now();

    const destroyedUser = await User.findOne(userToDestroy.id)
      .populate('image')
      .populate('teaching_classes')
      .populate('teaching_events')
      .populate('class_signups')
      .populate('class_livestream_signups')
      .populate('class_waiting_list_signups')
      .populate('event_signups')
      .populate('class_passes')
      .populate('memberships')
      .populate('cart_items');

    expect(destroyedUser).to.matchPattern(
      `{
        createdAt: _.isInteger,
        updatedAt: _.isInteger,
        id: ${userToDestroy.id},
        client: ${testClientId},
        archived: true,
        first_name: '',
        last_name: '',
        address_1: '',
        address_2: '',
        zip_code: '',
        city: '',
        country: '',
        phone: '',
        email: 'null@yogo.dk',
        email_confirmed: false,
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
        teacher_can_manage_all_classes: false,
        livestream_time_display_mode: 'remaining',
        image: null,
        teaching_classes: _.isArray,
        teaching_events: _.isArray,
        cart_items: [],
        class_passes: _.isArray,
        memberships: _.isArray,
        class_signups: _.isArray,
        class_waiting_list_signups: _.isArray,
        class_livestream_signups: _.isArray,
        event_signups: _.isArray,
        classpass_com_user_id: null,
      }`,
    );

    expect(destroyedUser.createdAt).to.be.greaterThan(timeBeforeDestroy - 1);
    expect(destroyedUser.createdAt).to.be.lessThan(timeAfterDestroy + 1);

    expect(destroyedUser.teaching_classes).to.matchPattern(`[{ id: ${classObj.id}, ... }]`);
    expect(destroyedUser.teaching_events).to.matchPattern(`[{ id: ${eventObj.id}, ... }]`);

    expect(destroyedUser.class_signups).to.matchPattern(`[{ cancelled_at: _.isGreaterThan|0, ... }]`);
    expect(destroyedUser.class_waiting_list_signups).to.matchPattern(`[{ cancelled_at: _.isGreaterThan|0, ... }]`);
    expect(destroyedUser.class_livestream_signups).to.matchPattern(`[{ cancelled_at: _.isGreaterThan|0, ... }]`);
    expect(destroyedUser.event_signups).to.matchPattern(`[{ archived: true, ... }]`);
    expect(destroyedUser.class_passes).to.matchPattern(`[{ archived: true, ... }]`);
    expect(destroyedUser.memberships).to.matchPattern(`[{ archived: true, ... }]`);

    const image1 = await Image.findOne(fixtures.image1.id);

    expect(image1.expires).to.be.greaterThan(timeBeforeDestroy - 1);
    expect(image1.expires).to.be.lessThan(timeAfterDestroy + 1);

    await Image.update({id: fixtures.image1.id}, {expires: 0});

    await User.destroy(userToDestroy.id);

    await ClassSignup.destroy({user: userToDestroy.id});
    await ClassWaitingListSignup.destroy({user: userToDestroy.id});
    await ClassLivestreamSignup.destroy({user: userToDestroy.id});
    await EventSignup.destroy({user: userToDestroy.id});

    await ClassPass.destroy({user: userToDestroy.id});
    await Membership.destroy({user: userToDestroy.id});
    await CartItem.destroy({user: userToDestroy.id});

    await Class.destroy({id: classObj.id});
    await Event.destroy({id: eventObj.id});

  });


});
