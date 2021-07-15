const assert = require('assert');
const moment = require('moment');

const assertAsyncThrows = require('../../../utils/assert-async-throws');
const assertAsyncDbObject = require('../../../utils/assert-async-db-object');

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID;
const fixtures = require('../../../fixtures/factory').fixtures;

const comparePartialObject = require('../../../utils/compare-partial-object');

const MockDate = require('mockdate');

describe('helpers.memberships.autoRenewOneMembership', async function () {

    let membership;

    let paymentSubscription;

    it('should log "Found no memberships that need payment" and return false, if there are none.', async () => {

        await CronLog.destroy({});

        const result = await sails.helpers.memberships.autoRenewOneMembership();

        assert.equal(
            result,
            false
        );

        const logEntries = await CronLog.find({});

        comparePartialObject(
            logEntries[logEntries.length - 1],
            {
                entry: "Found no memberships that need payment"
            }
        )

    });

    it('should tolerate errors from setAutoPaymentProcessingLock that begin with "fail" and just return false', async () => {

        membership = await Membership.create({
            user: fixtures.userAlice.id,
            paid_until: moment().subtract(1, 'day').format('YYYY-MM-DD'),
            client: testClientId,
            status: 'active'
        }).fetch();

        paymentSubscription = await PaymentSubscription.create({
            membership: membership.id,
            status: 'active'
        }).fetch();

        MockDate.reset();

        const tempFnc = sails.helpers.memberships.setAutoPaymentProcessingLock;

        sails.helpers.memberships.setAutoPaymentProcessingLock = () => {
            return {
                tolerate: async (fn) => {
                    const e = new Error();
                    e.code = 'failLoremIpsum';
                    await fn(e);
                }
            }
        };

        const result = await sails.helpers.memberships.autoRenewOneMembership();

        assert.equal(
            result,
            false
        );

        sails.helpers.memberships.setAutoPaymentProcessingLock = tempFnc;

        await PaymentSubscription.destroy({
            id: paymentSubscription.id
        });

        await Membership.destroy({
            id: membership.id
        });

    });

    it('should re-throw errors from setAutoPaymentProcessingLock that do not begin with "fail"', async () => {

        membership = await Membership.create({
            user: fixtures.userAlice.id,
            paid_until: moment().subtract(1, 'day').format('YYYY-MM-DD'),
            client: testClientId,
            status: 'active'
        }).fetch();

        paymentSubscription = await PaymentSubscription.create({
            membership: membership.id,
            status: 'active'
        }).fetch();

        MockDate.reset();


        const tempFnc = sails.helpers.memberships.setAutoPaymentProcessingLock;

        sails.helpers.memberships.setAutoPaymentProcessingLock = () => {
            return {
                tolerate: async (fn) => {
                    const e = new Error();
                    e.code = 'loremIpsum';
                    await fn(e);
                }
            }
        };

        await assertAsyncThrows(
            async () => {
                return await sails.helpers.memberships.autoRenewOneMembership();
            },
            'loremIpsum'
        );

        sails.helpers.memberships.setAutoPaymentProcessingLock = tempFnc;

        await PaymentSubscription.destroy({
            id: paymentSubscription.id
        });

        await Membership.destroy({
            id: membership.id
        });

    });

    it('should get payment if there is a membership that needs auto payment and return membership id', async () => {

        membership = await Membership.create({
            user: fixtures.userAlice.id,
            membership_type: fixtures.membershipTypeYogaUnlimited.id,
            payment_option: fixtures.yogaUnlimitedPaymentOptionMonthly.id,
            paid_until: '2018-05-15',
            client: testClientId,
            status: 'active'
        }).fetch();

        paymentSubscription = await PaymentSubscription.create({
            membership: membership.id,
            status: 'active',
            payment_provider_subscription_id: '12345678'
        }).fetch();


        MockDate.set('5/16/2018');

        const result = await sails.helpers.memberships.autoRenewOneMembership();

        assert.equal(
            result,
            membership.id
        );

        const updatedMembership = await Membership.findOne(membership.id);

        assert.equal(
            moment(updatedMembership.paid_until).format('YYYY-MM-DD'),
            '2018-06-15'
        );

        assert.equal(
            updatedMembership.automatic_payment_processing_started,
            false
        );

        MockDate.reset();

        await PaymentSubscription.destroy({
            id: paymentSubscription.id
        });

        await PaymentSubscriptionTransaction.destroy({})

        await Membership.destroy({
            id: membership.id
        });

    });


});
