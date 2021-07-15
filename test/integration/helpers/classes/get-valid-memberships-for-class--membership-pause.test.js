const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID;
const fixtures = require('../../../fixtures/factory').fixtures;
const mockdate = require('mockdate');
const moment = require('moment-timezone');

describe('get-valid-memberships-for-class--membership-pause', async function () {

  let classes, memberships, membershipPauses;

  before(async () => {

    await Class.destroy({});
    await Membership.destroy({});
    await MembershipPause.destroy({});

    classes = await Class.createEach([
      {
        class_type: fixtures.classTypeYoga.id,
        date: '2020-05-05',
        start_time: '09:00:00',
        client: testClientId,
        seats: 15,
      }, {
        class_type: fixtures.classTypeYoga.id,
        date: '2020-05-06',
        start_time: '10:00:00',
        client: testClientId,
        seats: 15,
      }, {
        class_type: fixtures.classTypeYoga.id,
        date: '2020-05-07',
        start_time: '16:00:00',
        client: testClientId,
        seats: 15,
      },
    ]).fetch();

    memberships = await Membership.createEach([
      {
        user: fixtures.userAlice.id,
        membership_type: fixtures.membershipTypeYogaUnlimited.id,
        status: 'active',
        paid_until: '2021-01-01',
      },
      {
        user: fixtures.userAlice.id,
        membership_type: fixtures.membershipTypeYogaUnlimited.id,
        status: 'active',
        paid_until: '2021-01-01',
      },
      {
        user: fixtures.userAlice.id,
        membership_type: fixtures.membershipTypeYogaUnlimited.id,
        status: 'active',
        paid_until: '2021-01-01',
      },
    ]).fetch();

    membershipPauses = await MembershipPause.createEach([
      {
        client_id: testClientId,
        membership_id: memberships[1].id,
        start_date: '2020-05-06',
      },
      {
        client_id: testClientId,
        membership_id: memberships[2].id,
        start_date: '2020-05-06',
        end_date: '2020-05-07',
      },
    ]).fetch();

    mockdate.set(moment.tz('2020-05-01 10:00:00', 'Europe/Copenhagen'));

  });

  after(async () => {

    await Class.destroy({id: _.map(classes, 'id')});

    await Membership.destroy({id: _.map(memberships, 'id')});

    await MembershipPause.destroy({id: _.map(membershipPauses, 'id')});

    mockdate.reset();

  });

  it('should return memberships that do not have a membership pause overlapping the class', async () => {


    const validMembershipsForClass0 = await sails.helpers.classes.getValidMembershipsForClass.with({
      user: fixtures.userAlice,
      classItem: classes[0],
    });

    expect(validMembershipsForClass0).to.matchPattern(`
      [
        {
          id: ${memberships[0].id},
          ...
        },
        {
          id: ${memberships[1].id},
          ...
        },
        {
          id: ${memberships[2].id},
          ...
        }
      ]`);

  });

  it('should not return memberships that have a membership pause overlapping the class', async () => {

    const validMembershipsForClass1 = await sails.helpers.classes.getValidMembershipsForClass.with({
      user: fixtures.userAlice,
      classItem: classes[1],
    });


    expect(validMembershipsForClass1).to.matchPattern(`     
      [
        {
          id: ${memberships[0].id},
          ...
        }        
      ]`);

  });


  it('should account for membership pauses without end date', async () => {

    const validMembershipsForClass2 = await sails.helpers.classes.getValidMembershipsForClass.with({
      user: fixtures.userAlice,
      classItem: classes[2],
    });

    expect(validMembershipsForClass2).to.matchPattern(`
      [
        {
          id: ${memberships[0].id},
          ...
        },        
        {
          id: ${memberships[2].id},
          ...
        }
      ]
    `);

  });

});
