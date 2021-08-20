const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID;
const fixtures = require('../../../fixtures/factory').fixtures;

const supertest = require('supertest');
const MockDate = require('mockdate');
const moment = require('moment-timezone');

describe('controllers.Cron.apply-no-show-fees', async () => {

  before(async () => {
    await ClassSignup.destroy({});
  });

  it('should apply no-show fees on the day after the class', async () => {

    const clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'no_show_fees_enabled',
      value: 1,
    }).fetch();

    const classTwoDaysBefore = await Class.create({
      client: testClientId,
      date: '2020-05-13',
      start_time: '10:00:00',
      end_time: '12:00:00',
      class_type: fixtures.classTypeYoga.id,
    }).fetch();

    const classDayBefore = await Class.create({
      client: testClientId,
      date: '2020-05-14',
      start_time: '10:00:00',
      end_time: '12:00:00',
      class_type: fixtures.classTypeYoga.id,
    }).fetch();

    const classSameDay = await Class.create({
      client: testClientId,
      date: '2020-05-15',
      start_time: '10:00:00',
      end_time: '12:00:00',
      class_type: fixtures.classTypeYoga.id,
    }).fetch();

    const classPassAlice = await ClassPass.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      class_pass_type: fixtures.classPassTypeYogaTenClasses.id,
      classes_left: 5,
    }).fetch();

    const signups = await ClassSignup.createEach([
        {
          client: testClientId,
          user: fixtures.userAlice.id,
          class: classTwoDaysBefore.id,
          used_class_pass: classPassAlice.id,
          class_pass_seat_spent: true,
        },
        {
          client: testClientId,
          user: fixtures.userAlice.id,
          class: classDayBefore.id,
          used_class_pass: classPassAlice.id,
          class_pass_seat_spent: true,
        },
        {
          client: testClientId,
          user: fixtures.userAlice.id,
          class: classSameDay.id,
          used_class_pass: classPassAlice.id,
          class_pass_seat_spent: true,
        },
      ],
    ).fetch();

    MockDate.set(moment.tz('2020-05-15 00:00:00', 'Europe/Copenhagen'));
    const timestampBeforeCall = Date.now();

    await supertest(sails.hooks.http.app)
      .post('/cron/apply-no-show-fees')
      .expect(200);

    const timestampAfterCall = Date.now();

    const updatedSignups = await ClassSignup.find({});

    updatedSignups.sort((a, b) => {
      return a.class > b.class ? 1 : -1;
    });

    expect(updatedSignups).to.matchPattern(`[
      {
        user: ${fixtures.userAlice.id},
        class: ${classTwoDaysBefore.id},
        used_class_pass: ${classPassAlice.id},
        no_show_fee_applied: false,
        ...
      },
      {
        user: ${fixtures.userAlice.id},
        class: ${classDayBefore.id},
        used_class_pass: ${classPassAlice.id},
        no_show_fee_applied: true,
        ...
      },
      {
        user: ${fixtures.userAlice.id},
        class: ${classSameDay.id},
        used_class_pass: ${classPassAlice.id},
        no_show_fee_applied: false,
        ...
      },
    ]`);

    const createdNoShowFees = await NoShowFee.find({});
    expect(createdNoShowFees).to.matchPattern(`[
      {
        createdAt: _.isBetween|${timestampBeforeCall - 1}|${timestampAfterCall + 1},
        updatedAt: _.isBetween|${timestampBeforeCall - 1}|${timestampAfterCall + 1},
        id: _.isInteger,
        archived: false,
        client_id: ${testClientId},
        user_id: ${fixtures.userAlice.id},
        class_id: ${classDayBefore.id},
        amount: 0,
        days_deducted: 0,        
        classes_spent: 1,
        class_signup_id: ${signups[1].id},
        reason: 'no_show',
        cancelled_at: 0,
        paid_with_order_id: null,
        membership_id: null,
        class_pass_id: ${classPassAlice.id}
      }
    ]`);


    await Class.destroy({
      id: [
        classTwoDaysBefore.id,
        classDayBefore.id,
        classSameDay.id,
      ],
    });
    await ClassPass.destroy({id: classPassAlice.id});
    await ClassSignup.destroy({id: _.map(signups, 'id')});
    await ClientSettings.destroy({id: clientSettingsRow.id});
    await NoShowFee.destroy({id: _.map(createdNoShowFees, 'id')});

  });

  it('should not touch archived or cancelled classes', async () => {

    const clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'no_show_fees_enabled',
      value: 1,
    }).fetch();

    const classArchived = await Class.create({
      client: testClientId,
      date: '2020-05-14',
      start_time: '10:00:00',
      end_time: '12:00:00',
      class_type: fixtures.classTypeYoga.id,
      archived: true,
    }).fetch();

    const classCancelled = await Class.create({
      client: testClientId,
      date: '2020-05-14',
      start_time: '10:00:00',
      end_time: '12:00:00',
      class_type: fixtures.classTypeYoga.id,
      cancelled: true,
    }).fetch();

    const classActive = await Class.create({
      client: testClientId,
      date: '2020-05-14',
      start_time: '10:00:00',
      end_time: '12:00:00',
      class_type: fixtures.classTypeYoga.id,
    }).fetch();

    const classPassAlice = await ClassPass.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      class_pass_type: fixtures.classPassTypeYogaTenClasses.id,
      classes_left: 5,
    }).fetch();

    const signups = await ClassSignup.createEach([
        {
          client: testClientId,
          user: fixtures.userAlice.id,
          class: classArchived.id,
          used_class_pass: classPassAlice.id,
          class_pass_seat_spent: true,
        },
        {
          client: testClientId,
          user: fixtures.userAlice.id,
          class: classCancelled.id,
          used_class_pass: classPassAlice.id,
          class_pass_seat_spent: true,
        },
        {
          client: testClientId,
          user: fixtures.userAlice.id,
          class: classActive.id,
          used_class_pass: classPassAlice.id,
          class_pass_seat_spent: true,
        },
      ],
    ).fetch();

    MockDate.set(moment.tz('2020-05-15 00:00:00', 'Europe/Copenhagen'));
    const timestampBeforeCall = Date.now();

    await supertest(sails.hooks.http.app)
      .post('/cron/apply-no-show-fees')
      .expect(200);

    const timestampAfterCall = Date.now();

    const updatedSignups = await ClassSignup.find({});
    expect(updatedSignups).to.matchPattern(`[
      {
        user: ${fixtures.userAlice.id},
        class: ${classArchived.id},
        used_class_pass: ${classPassAlice.id},
        no_show_fee_applied: false,
        ...
      },
      {
        user: ${fixtures.userAlice.id},
        class: ${classCancelled.id},
        used_class_pass: ${classPassAlice.id},
        no_show_fee_applied: false,
        ...
      },
      {
        user: ${fixtures.userAlice.id},
        class: ${classActive.id},
        used_class_pass: ${classPassAlice.id},
        no_show_fee_applied: true,
        ...
      },
    ]`);

    const createdNoShowFees = await NoShowFee.find({});
    expect(createdNoShowFees).to.matchPattern(`[
      {        
        amount: 0,
        days_deducted: 0,        
        classes_spent: 1,
        class_signup_id: ${signups[2].id},
        reason: 'no_show',
        cancelled_at: 0,
        ...       
      }
    ]`);


    await Class.destroy({
      id: [
        classArchived.id,
        classCancelled.id,
        classActive.id,
      ],
    });
    await ClassPass.destroy({id: classPassAlice.id});
    await ClassSignup.destroy({id: _.map(signups, 'id')});
    await ClientSettings.destroy({id: clientSettingsRow.id});
    await NoShowFee.destroy({id: _.map(createdNoShowFees, 'id')});

  });

  it('should not touch signups that are archived, cancelled, where the customer is checked in or a fee is already applied', async () => {

    const clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'no_show_fees_enabled',
      value: 1,
    }).fetch();

    const class1 = await Class.create({
      client: testClientId,
      date: '2020-05-14',
      start_time: '10:00:00',
      end_time: '12:00:00',
      class_type: fixtures.classTypeYoga.id,
    }).fetch();

    const class2 = await Class.create({
      client: testClientId,
      date: '2020-05-14',
      start_time: '10:00:00',
      end_time: '12:00:00',
      class_type: fixtures.classTypeYoga.id,
    }).fetch();

    const class3 = await Class.create({
      client: testClientId,
      date: '2020-05-14',
      start_time: '10:00:00',
      end_time: '12:00:00',
      class_type: fixtures.classTypeYoga.id,
    }).fetch();

    const class4 = await Class.create({
      client: testClientId,
      date: '2020-05-14',
      start_time: '10:00:00',
      end_time: '12:00:00',
      class_type: fixtures.classTypeYoga.id,
    }).fetch();

    const class5 = await Class.create({
      client: testClientId,
      date: '2020-05-14',
      start_time: '10:00:00',
      end_time: '12:00:00',
      class_type: fixtures.classTypeYoga.id,
    }).fetch();

    const classPassAlice = await ClassPass.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      class_pass_type: fixtures.classPassTypeYogaTenClasses.id,
      classes_left: 5,
    }).fetch();

    const signups = await ClassSignup.createEach([
        {
          client: testClientId,
          user: fixtures.userAlice.id,
          class: class1.id,
          used_class_pass: classPassAlice.id,
          class_pass_seat_spent: true,
          archived: 1,
        },
        {
          client: testClientId,
          user: fixtures.userAlice.id,
          class: class2.id,
          used_class_pass: classPassAlice.id,
          class_pass_seat_spent: true,
          cancelled_at: 999999,
        },
        {
          client: testClientId,
          user: fixtures.userAlice.id,
          class: class3.id,
          used_class_pass: classPassAlice.id,
          class_pass_seat_spent: true,
          checked_in: 999999999,
        },
        {
          client: testClientId,
          user: fixtures.userAlice.id,
          class: class4.id,
          used_class_pass: classPassAlice.id,
          class_pass_seat_spent: true,
          no_show_fee_applied: true,
        },
        {
          client: testClientId,
          user: fixtures.userAlice.id,
          class: class5.id,
          used_class_pass: classPassAlice.id,
          class_pass_seat_spent: true,
        },
      ],
    ).fetch();

    MockDate.set(moment.tz('2020-05-15 00:00:00', 'Europe/Copenhagen'));
    const timestampBeforeCall = Date.now();

    await supertest(sails.hooks.http.app)
      .post('/cron/apply-no-show-fees')
      .expect(200);

    const timestampAfterCall = Date.now();

    const updatedSignups = await ClassSignup.find({});

    updatedSignups.sort((a, b) => {
      return a.class > b.class ? 1 : -1;
    });

    expect(updatedSignups).to.matchPattern(`[
      {        
        class: ${class1.id},       
        no_show_fee_applied: false,
        ...
      },
      {
        class: ${class2.id},
        no_show_fee_applied: false,
        ...
      },
      {
        class: ${class3.id},
        no_show_fee_applied: false,
        ...
      },
      {
        class: ${class4.id},
        no_show_fee_applied: true,
        ...
      },
      {
        class: ${class5.id},
        no_show_fee_applied: true,
        ...
      },
    ]`);

    const createdNoShowFees = await NoShowFee.find({});
    expect(createdNoShowFees).to.matchPattern(`[
      {        
        amount: 0,
        days_deducted: 0,        
        classes_spent: 1,
        class_signup_id: ${signups[4].id},
        reason: 'no_show',
        cancelled_at: 0,
        ...       
      }
    ]`);


    await Class.destroy({
      id: [
        class1.id,
        class2.id,
        class3.id,
        class4.id,
      ],
    });
    await ClassPass.destroy({id: classPassAlice.id});
    await ClassSignup.destroy({id: _.map(signups, 'id')});
    await ClientSettings.destroy({id: clientSettingsRow.id});
    await NoShowFee.destroy({id: _.map(createdNoShowFees, 'id')});

  });

  it('should apply to memberships, unlimited class passes and fixed count class passes', async () => {

    const clientSettingsRow = await ClientSettings.create({
      client: testClientId,
      key: 'no_show_fees_enabled',
      value: 1,
    }).fetch();

    const class1 = await Class.create({
      client: testClientId,
      date: '2020-05-14',
      start_time: '10:00:00',
      end_time: '12:00:00',
      class_type: fixtures.classTypeYoga.id,
    }).fetch();

    const class2 = await Class.create({
      client: testClientId,
      date: '2020-05-14',
      start_time: '10:00:00',
      end_time: '12:00:00',
      class_type: fixtures.classTypeYoga.id,
    }).fetch();

    const class3 = await Class.create({
      client: testClientId,
      date: '2020-05-14',
      start_time: '10:00:00',
      end_time: '12:00:00',
      class_type: fixtures.classTypeYoga.id,
    }).fetch();

    const classPassAlice = await ClassPass.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      class_pass_type: fixtures.classPassTypeYogaTenClasses.id,
      classes_left: 5,
    }).fetch();

    const classPassBill = await ClassPass.create({
      client: testClientId,
      user: fixtures.userBill.id,
      class_pass_type: fixtures.classPassTypeYogaUnlimitedOneMonth.id,
      valid_until: '2020-05-30',
    }).fetch();

    const membershipCharlie = await Membership.create({
      client: testClientId,
      user: fixtures.userCharlie.id,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      status: 'active',
    }).fetch();

    const signups = await ClassSignup.createEach([
        {
          client: testClientId,
          user: fixtures.userAlice.id,
          class: class1.id,
          used_class_pass: classPassAlice.id,
          class_pass_seat_spent: true,
        },
        {
          client: testClientId,
          user: fixtures.userBill.id,
          class: class2.id,
          used_class_pass: classPassBill.id,
        },
        {
          client: testClientId,
          user: fixtures.userCharlie.id,
          class: class3.id,
          used_membership: membershipCharlie.id,
        },
      ],
    ).fetch();

    MockDate.set(moment.tz('2020-05-15 00:00:00', 'Europe/Copenhagen'));

    const timestampBeforeCall = Date.now();
    await supertest(sails.hooks.http.app)
      .post('/cron/apply-no-show-fees')
      .expect(200);

    const timestampAfterCall = Date.now();

    const updatedSignups = await ClassSignup.find({});

    updatedSignups.sort((a, b) => {
      return a.class > b.class ? 1 : -1;
    });

    expect(updatedSignups).to.matchPattern(`[
      {        
        class: ${class1.id},       
        no_show_fee_applied: true,
        ...
      },
      {
        class: ${class2.id},
        no_show_fee_applied: true,
        ...
      },
      {
        class: ${class3.id},
        no_show_fee_applied: true,
        ...
      },      
    ]`);

    const createdNoShowFees = await NoShowFee.find({}).sort('class_signup_id ASC');
    expect(createdNoShowFees).to.matchPattern(`[
      {        
        amount: 0,
        days_deducted: 0,        
        classes_spent: 1,
        class_signup_id: ${signups[0].id},
        reason: 'no_show',
        cancelled_at: 0,
        ...       
      },
      {        
        amount: 0,
        days_deducted: 1,        
        classes_spent: 0,
        class_signup_id: ${signups[1].id},
        reason: 'no_show',
        cancelled_at: _.isBetween|${timestampBeforeCall - 1}|${timestampAfterCall + 1},
        ...       
      },
      {        
        amount: 30,
        days_deducted: 0,        
        classes_spent: 0,
        class_signup_id: ${signups[2].id},
        reason: 'no_show',
        cancelled_at: _.isBetween|${timestampBeforeCall - 1}|${timestampAfterCall + 1},
        ...       
      }
    ]`);


    await Class.destroy({
      id: [
        class1.id,
        class2.id,
        class3.id,
      ],
    });
    await ClassPass.destroy({id: [classPassAlice.id, classPassBill.id]});
    await Membership.destroy({id: membershipCharlie.id});
    await ClassSignup.destroy({id: _.map(signups, 'id')});
    await ClientSettings.destroy({id: clientSettingsRow.id});
    await NoShowFee.destroy({id: _.map(createdNoShowFees, 'id')});

  });

  it('should use different settings for different clients', async () => {
    await ClassSignup.destroy({})

    const clientSettingsRows = await ClientSettings.createEach(
      [
        {
          client: testClientId,
          key: 'no_show_fees_enabled',
          value: 1,
        },
        {
          client: fixtures.testClient2.id,
          key: 'no_show_fees_enabled',
          value: 1,
        },
        {
          client: testClientId,
          key: 'no_show_fees_apply_method',
          value: 'automatic',
        },
      ],
    ).fetch();

    const class1 = await Class.create({
      client: testClientId,
      date: '2020-05-14',
      start_time: '10:00:00',
      end_time: '12:00:00',
      class_type: fixtures.classTypeYoga.id,
    }).fetch();

    const class2 = await Class.create({
      client: fixtures.testClient2.id,
      date: '2020-05-14',
      start_time: '10:00:00',
      end_time: '12:00:00',
      class_type: fixtures.classTypeYoga.id,
    }).fetch();

    const classPassAlice = await ClassPass.create({
      client: testClientId,
      user: fixtures.userAlice.id,
      class_pass_type: fixtures.classPassTypeYogaUnlimitedOneMonth.id,
      valid_until: '2020-05-30',
    }).fetch();

    const classPassBill = await ClassPass.create({
      client: fixtures.testClient2.id,
      user: fixtures.userBill.id,
      class_pass_type: fixtures.classPassTypeYogaUnlimitedOneMonth.id,
      valid_until: '2020-05-30',
    }).fetch();

    const signups = await ClassSignup.createEach([
        {
          client: testClientId,
          user: fixtures.userAlice.id,
          class: class1.id,
          used_class_pass: classPassAlice.id,
        },
        {
          client: fixtures.testClient2.id,
          user: fixtures.userBill.id,
          class: class2.id,
          used_class_pass: classPassBill.id,
        },

      ],
    ).fetch();

    MockDate.set(moment.tz('2020-05-15 00:00:00', 'Europe/Copenhagen'));

    const timestampBeforeCall = Date.now();
    await supertest(sails.hooks.http.app)
      .post('/cron/apply-no-show-fees')
      .expect(200);

    const timestampAfterCall = Date.now();

    const updatedSignups = await ClassSignup.find({});

    updatedSignups.sort((a, b) => {
      return a.class > b.class ? 1 : -1;
    });

    expect(updatedSignups).to.matchPattern(`[
      {        
        class: ${class1.id},       
        no_show_fee_applied: true,
        ...
      },
      {
        class: ${class2.id},
        no_show_fee_applied: true,
        ...
      },            
    ]`);

    const createdNoShowFees = await NoShowFee.find({});
    expect(createdNoShowFees).to.matchPattern(`[
      {        
        amount: 0,
        days_deducted: 1,        
        classes_spent: 0,
        class_signup_id: ${signups[0].id},
        reason: 'no_show',
        cancelled_at: 0,
        ...       
      },
      {        
        amount: 0,
        days_deducted: 1,        
        classes_spent: 0,
        class_signup_id: ${signups[1].id},
        reason: 'no_show',
        cancelled_at: _.isBetween|${timestampBeforeCall - 1}|${timestampAfterCall + 1},
        ...       
      },      
    ]`);


    await Class.destroy({
      id: [
        class1.id,
        class2.id,
      ],
    });
    await ClassPass.destroy({id: [classPassAlice.id, classPassBill.id]});
    await ClassSignup.destroy({id: _.map(signups, 'id')});
    await ClientSettings.destroy({id: _.map(clientSettingsRows, 'id')});
    await NoShowFee.destroy({id: _.map(createdNoShowFees, 'id')});

  });

});

