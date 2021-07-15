const testClientId = require('../../../../global-test-variables').TEST_CLIENT_ID;
const fixtures = require('../../../../fixtures/factory').fixtures;
const moment = require('moment-timezone');
const MockDate = require('mockdate');

describe('helpers.populate.memberships.next-payment', async () => {

  afterEach(async () => {
    MockDate.reset();
  });

  it('should return an empty array if input array is empty', async () => {

    const result = await sails.helpers.populate.memberships.nextPayment([]);

    expect(result).to.deep.equal([]);

  });

  it('should return input unchanged if input is already populated', async () => {

    const memberships = [
      {
        next_payment: {
          amount: 100,
        },
      },
      {
        next_payment: {
          amount: 200,
        },
      },
    ];

    await sails.helpers.populate.memberships.nextPayment(memberships);

    expect(memberships).to.matchPattern(`[
      {
        next_payment: {
          amount: 100
        }
      },
      {
        next_payment: {
          amount: 200
        }
      }
    ]`);

  });

  it('should return input unchanged if input is already populated with null values', async () => {

    const memberships = [
      {
        next_payment: null,
      },
      {
        next_payment: {
          amount: 200,
        },
      },
    ];

    await sails.helpers.populate.memberships.nextPayment(memberships);

    expect(memberships).to.matchPattern(`[
      {
        next_payment: null,
      },
      {
        next_payment: {
          amount: 200
        }
      }
    ]`);

  });

  it('should populate next payment', async () => {

    const membership = (
      await Membership.create({
        client: testClientId,
        membership_type: fixtures.membershipTypeYogaUnlimited.id,
        paid_until: '2020-05-31',
        status: 'active',
        payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
      }).fetch()
    ).toJSON();

    await sails.helpers.populate.memberships.nextPayment([membership]);

    expect(membership).to.matchPattern(`{
      client: ${testClientId},
      membership_type: ${fixtures.membershipTypeYogaUnlimited.id},
      paid_until: '2020-05-31',
      status: 'active',
      next_payment: {
        date: '2020-06-01',
        amount: 300
      },
      ...
    }`);

    await Membership.destroy({id: membership.id});

  });

  it('should populate next payment, membership type is object', async () => {

    const membership = (
      await Membership.create({
        client: testClientId,
        membership_type: fixtures.membershipTypeYogaUnlimited.id,
        paid_until: '2020-05-31',
        status: 'active',
        payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
      }).fetch()
    ).toJSON();

    membership.membership_type = fixtures.membershipTypeYogaUnlimited;
    await sails.helpers.populate.memberships.nextPayment([membership]);

    expect(membership).to.matchPattern(`{
      client: ${testClientId},
      membership_type: {id: ${fixtures.membershipTypeYogaUnlimited.id}, ...},
      paid_until: '2020-05-31',
      status: 'active',
      next_payment: {
        date: '2020-06-01',
        amount: 300
      },
      ...
    }`);

    await Membership.destroy({id: membership.id});

  });

  it('should populate next payment, using membership_type_id', async () => {

    const membership = (
      await Membership.create({
        client: testClientId,
        membership_type: fixtures.membershipTypeYogaUnlimited.id,
        paid_until: '2020-05-31',
        status: 'active',
        payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
      }).fetch()
    ).toJSON();

    delete membership.membership_type;
    membership.membership_type_id = fixtures.membershipTypeYogaUnlimited.id;
    await sails.helpers.populate.memberships.nextPayment([membership]);

    expect(membership).to.matchPattern(`{
      client: ${testClientId},
      membership_type_id: ${fixtures.membershipTypeYogaUnlimited.id},
      paid_until: '2020-05-31',
      status: 'active',
      next_payment: {
        date: '2020-06-01',
        amount: 300
      },
      ...
    }`);

    await Membership.destroy({id: membership.id});

  });

  it('should account for a campaign', async () => {

    const membershipCampaign = await MembershipCampaign.create({
      client: testClientId,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      number_of_months_at_reduced_price: 2,
      reduced_price: 150,
    }).fetch();

    const membership = (
      await Membership.create({
        client: testClientId,
        membership_type: fixtures.membershipTypeYogaUnlimited.id,
        paid_until: '2020-05-31',
        status: 'active',
        payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
        membership_campaign_number_of_reduced_payments_left: 1,
        membership_campaign: membershipCampaign.id,
      }).fetch()
    ).toJSON();


    await sails.helpers.populate.memberships.nextPayment([membership]);

    expect(membership).to.matchPattern(`{
      client: ${testClientId},
      membership_type: ${fixtures.membershipTypeYogaUnlimited.id},
      paid_until: '2020-05-31',
      status: 'active',
      next_payment: {
        date: '2020-06-01',
        amount: 150
      },
      ...
    }`);

    await Membership.destroy({id: membership.id});
    await MembershipCampaign.destroy({id: membershipCampaign.id});

  });

  it('should disregard a campaign if there are no reduced payments left', async () => {

    const membershipCampaign = await MembershipCampaign.create({
      client: testClientId,
      membership_type: fixtures.membershipTypeYogaUnlimited.id,
      number_of_months_at_reduced_price: 2,
      reduced_price: 150,
    }).fetch();

    const membership = (
      await Membership.create({
        client: testClientId,
        membership_type: fixtures.membershipTypeYogaUnlimited.id,
        paid_until: '2020-05-31',
        status: 'active',
        payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
        membership_campaign_number_of_reduced_payments_left: 0,
        membership_campaign: membershipCampaign.id,
      }).fetch()
    ).toJSON();


    await sails.helpers.populate.memberships.nextPayment([membership]);

    expect(membership).to.matchPattern(`{
      client: ${testClientId},
      membership_type: ${fixtures.membershipTypeYogaUnlimited.id},
      paid_until: '2020-05-31',
      status: 'active',
      next_payment: {
        date: '2020-06-01',
        amount: 300
      },
      ...
    }`);

    await Membership.destroy({id: membership.id});
    await MembershipCampaign.destroy({id: membershipCampaign.id});

  });

  it('should account for a discount code', async () => {

    const discountCode = await DiscountCode.create({
      client: testClientId,
      type: 'discount_percent',
      discount_percent: 25,
      valid_for_items: ['membership_type_' + fixtures.membershipTypeYogaUnlimited.id],
    }).fetch();

    const membership = (
      await Membership.create({
        client: testClientId,
        membership_type: fixtures.membershipTypeYogaUnlimited.id,
        paid_until: '2020-05-31',
        status: 'active',
        payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
        discount_code: discountCode.id,
      }).fetch()
    ).toJSON();


    await sails.helpers.populate.memberships.nextPayment([membership]);

    expect(membership).to.matchPattern(`{
      client: ${testClientId},
      membership_type: ${fixtures.membershipTypeYogaUnlimited.id},
      paid_until: '2020-05-31',
      status: 'active',
      next_payment: {
        date: '2020-06-01',
        amount: 225
      },
      ...
    }`);

    await Membership.destroy({id: membership.id});
    await DiscountCode.destroy({id: discountCode.id});

  });

  it('should disregard a discount code that is not valid for the membership', async () => {

    const discountCode = await DiscountCode.create({
      client: testClientId,
      type: 'discount_percent',
      discount_percent: 25,
      valid_for_items: ['class_pass_type_1'],
    }).fetch();

    const membership = (
      await Membership.create({
        client: testClientId,
        membership_type: fixtures.membershipTypeYogaUnlimited.id,
        paid_until: '2020-05-31',
        status: 'active',
        payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
        discount_code: discountCode.id,
      }).fetch()
    ).toJSON();


    await sails.helpers.populate.memberships.nextPayment([membership]);

    expect(membership).to.matchPattern(`{
      client: ${testClientId},
      membership_type: ${fixtures.membershipTypeYogaUnlimited.id},
      paid_until: '2020-05-31',
      status: 'active',
      next_payment: {
        date: '2020-06-01',
        amount: 300
      },
      ...
    }`);

    await Membership.destroy({id: membership.id});
    await DiscountCode.destroy({id: discountCode.id});

  });

  it('should account for a membership pause that starts and ends before next payment date', async () => {

    const membership = (
      await Membership.create({
        client: testClientId,
        membership_type: fixtures.membershipTypeYogaUnlimited.id,
        paid_until: '2020-05-31',
        status: 'active',
        payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
      }).fetch()
    ).toJSON();

    const membershipPause = await MembershipPause.create({
      client_id: testClientId,
      membership_id: membership.id,
      start_date: '2020-05-15',
      end_date: '2020-05-22',
    }).fetch();

    MockDate.set(moment.tz('2020-05-10', 'Europe/Copenhagen'));
    await sails.helpers.populate.memberships.nextPayment([membership]);

    expect(membership).to.matchPattern(`{
      client: ${testClientId},
      membership_type: ${fixtures.membershipTypeYogaUnlimited.id},
      paid_until: '2020-05-31',
      status: 'active',
      next_payment: {
        date: '2020-06-08',
        amount: 300
      },
      ...
    }`);

    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: membershipPause.id});

  });

  it('should account for a membership pause that starts before and ends after next payment date', async () => {

    const membership = (
      await Membership.create({
        client: testClientId,
        membership_type: fixtures.membershipTypeYogaUnlimited.id,
        paid_until: '2020-05-31',
        status: 'active',
        payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
      }).fetch()
    ).toJSON();

    const membershipPause = await MembershipPause.create({
      client_id: testClientId,
      membership_id: membership.id,
      start_date: '2020-05-15',
      end_date: '2020-06-15',
    }).fetch();

    MockDate.set(moment.tz('2020-05-10', 'Europe/Copenhagen'));
    await sails.helpers.populate.memberships.nextPayment([membership]);

    expect(membership).to.matchPattern(`{
      client: ${testClientId},
      membership_type: ${fixtures.membershipTypeYogaUnlimited.id},
      paid_until: '2020-05-31',
      status: 'active',
      next_payment: {
        date: '2020-07-02',
        amount: 300
      },
      ...
    }`);

    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: membershipPause.id});

  });

  it('should account for a membership pause that starts on next payment date', async () => {

    const membership = (
      await Membership.create({
        client: testClientId,
        membership_type: fixtures.membershipTypeYogaUnlimited.id,
        paid_until: '2020-05-31',
        status: 'active',
        payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
      }).fetch()
    ).toJSON();

    const membershipPause = await MembershipPause.create({
      client_id: testClientId,
      membership_id: membership.id,
      start_date: '2020-06-01',
      end_date: '2020-06-15',
    }).fetch();

    MockDate.set(moment.tz('2020-05-10', 'Europe/Copenhagen'));
    await sails.helpers.populate.memberships.nextPayment([membership]);

    expect(membership).to.matchPattern(`{
      client: ${testClientId},
      membership_type: ${fixtures.membershipTypeYogaUnlimited.id},
      paid_until: '2020-05-31',
      status: 'active',
      next_payment: {
        date: '2020-06-15',
        amount: 300
      },
      ...
    }`);

    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: membershipPause.id});

  });

  it('should disregard a membership pause that starts after next payment date', async () => {

    const membership = (
      await Membership.create({
        client: testClientId,
        membership_type: fixtures.membershipTypeYogaUnlimited.id,
        paid_until: '2020-05-31',
        status: 'active',
        payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
      }).fetch()
    ).toJSON();

    MockDate.set(moment.tz('2020-05-10', 'Europe/Copenhagen'));
    const membershipPause = await MembershipPause.create({
      client_id: testClientId,
      membership_id: membership.id,
      start_date: '2020-06-02',
      end_date: '2020-07-02',
    }).fetch();


    await sails.helpers.populate.memberships.nextPayment([membership]);

    expect(membership).to.matchPattern(`{
      client: ${testClientId},
      membership_type: ${fixtures.membershipTypeYogaUnlimited.id},
      paid_until: '2020-05-31',
      status: 'active',
      next_payment: {
        date: '2020-06-01',
        amount: 300
      },
      ...
    }`);

    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: membershipPause.id});

  });

  it('should disregard a membership pause that has already been applied', async () => {

    const membership = (
      await Membership.create({
        client: testClientId,
        membership_type: fixtures.membershipTypeYogaUnlimited.id,
        paid_until: '2020-05-31',
        status: 'active',
        payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
      }).fetch()
    ).toJSON();

    const membershipPause = await MembershipPause.create({
      client_id: testClientId,
      membership_id: membership.id,
      start_date: '2020-06-02',
      end_date: '2020-07-02',
      is_applied_to_membership_at: 1234567890,
    }).fetch();

    MockDate.set(moment.tz('2020-05-10', 'Europe/Copenhagen'));
    await sails.helpers.populate.memberships.nextPayment([membership]);

    expect(membership).to.matchPattern(`{
      client: ${testClientId},
      membership_type: ${fixtures.membershipTypeYogaUnlimited.id},
      paid_until: '2020-05-31',
      status: 'active',
      next_payment: {
        date: '2020-06-01',
        amount: 300
      },
      ...
    }`);

    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: membershipPause.id});

  });

  it('should disregard a membership pause that is archived', async () => {

    const membership = (
      await Membership.create({
        client: testClientId,
        membership_type: fixtures.membershipTypeYogaUnlimited.id,
        paid_until: '2020-05-31',
        status: 'active',
        payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
      }).fetch()
    ).toJSON();

    const membershipPause = await MembershipPause.create({
      client_id: testClientId,
      membership_id: membership.id,
      start_date: '2020-06-01',
      end_date: '2020-07-01',
      archived: true,
    }).fetch();

    MockDate.set(moment.tz('2020-05-10', 'Europe/Copenhagen'));
    await sails.helpers.populate.memberships.nextPayment([membership]);

    expect(membership).to.matchPattern(`{
      client: ${testClientId},
      membership_type: ${fixtures.membershipTypeYogaUnlimited.id},
      paid_until: '2020-05-31',
      status: 'active',
      next_payment: {
        date: '2020-06-01',
        amount: 300
      },
      ...
    }`);

    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: membershipPause.id});

  });

  it('should return null for date if relevant membership pause has no end date', async () => {

    const membership = (
      await Membership.create({
        client: testClientId,
        membership_type: fixtures.membershipTypeYogaUnlimited.id,
        paid_until: '2020-05-31',
        status: 'active',
        payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
      }).fetch()
    ).toJSON();

    const membershipPause = await MembershipPause.create({
      client_id: testClientId,
      membership_id: membership.id,
      start_date: '2020-05-02',
    }).fetch();

    MockDate.set(moment.tz('2020-05-10', 'Europe/Copenhagen'));
    await sails.helpers.populate.memberships.nextPayment([membership]);

    expect(membership).to.matchPattern(`{
      client: ${testClientId},
      membership_type: ${fixtures.membershipTypeYogaUnlimited.id},
      paid_until: '2020-05-31',
      status: 'active',
      next_payment: {
        date: null,
        amount: 300
      },
      ...
    }`);

    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: membershipPause.id});

  });

  it('should apply membership pause before calculating date', async () => {

    const membership = (
      await Membership.create({
        client: testClientId,
        membership_type: fixtures.membershipTypeYogaUnlimited.id,
        user: fixtures.userAlice.id,
        paid_until: '2020-05-31',
        status: 'active',
        payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
      }).fetch()
    ).toJSON();

    const membershipPause = await MembershipPause.create({
      client_id: testClientId,
      membership_id: membership.id,
      start_date: '2020-05-15',
      end_date: '2020-05-22',
    }).fetch();

    MockDate.set(moment.tz('2020-05-22', 'Europe/Copenhagen'));
    const timestampBeforeCall = Date.now();
    await sails.helpers.populate.memberships.nextPayment([membership]);
    const timestampAfterCall = Date.now();

    expect(membership).to.matchPattern(`{
      client: ${testClientId},
      membership_type: ${fixtures.membershipTypeYogaUnlimited.id},
      paid_until: '2020-06-07',
      status: 'active',
      next_payment: {
        date: '2020-06-15',
        amount: 300
      },
      ...
    }`);

    const updatedMembership = (await Membership.findOne(membership.id)).toJSON();
    expect(updatedMembership).to.matchPattern(`{
      paid_until: '2020-06-07',
      ...
    }`);

    const updatedMembershipPause = (await MembershipPause.findOne(membershipPause.id)).toJSON();
    expect(updatedMembershipPause).to.matchPattern(`{
      membership_id: ${membership.id},
      start_date: '2020-05-15',
      end_date: '2020-05-22',
      is_applied_to_membership_at: _.isBetween|${timestampBeforeCall - 1}|${timestampAfterCall + 1},
      ...
    }`);

    await Membership.destroy({id: membership.id});
    await MembershipPause.destroy({id: membershipPause.id});

  });

  it('should return null if membership is cancelled and running', async () => {

    const membership = (
      await Membership.create({
        client: testClientId,
        membership_type: fixtures.membershipTypeYogaUnlimited.id,
        paid_until: '2020-05-31',
        cancelled_from_date: '2020-06-01',
        status: 'cancelled_running',
        payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
      }).fetch()
    ).toJSON();

    await sails.helpers.populate.memberships.nextPayment([membership]);

    expect(membership).to.matchPattern(`{
      client: ${testClientId},
      membership_type: ${fixtures.membershipTypeYogaUnlimited.id},
      paid_until: '2020-05-31',
      status: 'cancelled_running',
      next_payment: null,
      ...
    }`);

    await Membership.destroy({id: membership.id});

  });

  it('should return next payment if membership is cancelled and running but still has payment left', async () => {

    const membership = (
      await Membership.create({
        client: testClientId,
        membership_type: fixtures.membershipTypeYogaUnlimited.id,
        paid_until: '2020-05-31',
        cancelled_from_date: '2020-07-01',
        status: 'cancelled_running',
        payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
      }).fetch()
    ).toJSON();

    await sails.helpers.populate.memberships.nextPayment([membership]);

    expect(membership).to.matchPattern(`{
      client: ${testClientId},
      membership_type: ${fixtures.membershipTypeYogaUnlimited.id},
      paid_until: '2020-05-31',
      status: 'cancelled_running',
      next_payment: {
        date: '2020-06-01',
        amount: 300
      },
      ...
    }`);

    await Membership.destroy({id: membership.id});

  });

  it('should return null if membership is terminated', async () => {

    const membership = (
      await Membership.create({
        client: testClientId,
        membership_type: fixtures.membershipTypeYogaUnlimited.id,
        paid_until: '2020-05-31',
        status: 'ended',
        payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
      }).fetch()
    ).toJSON();

    await sails.helpers.populate.memberships.nextPayment([membership]);

    expect(membership).to.matchPattern(`{
      client: ${testClientId},
      membership_type: ${fixtures.membershipTypeYogaUnlimited.id},
      paid_until: '2020-05-31',
      status: 'ended',
      next_payment: null,
      ...
    }`);

    await Membership.destroy({id: membership.id});

  });

});
