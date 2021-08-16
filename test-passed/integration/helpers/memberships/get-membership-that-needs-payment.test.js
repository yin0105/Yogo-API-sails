const assert = require('assert');
const moment = require('moment');

const assertAsyncThrows = require('../../../utils/assert-async-throws');
const assertAsyncDbObject = require('../../../utils/assert-async-db-object');

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID;
const fixtures = require('../../../fixtures/factory').fixtures;

const comparePartialObject = require('../../../utils/compare-partial-object');
const compareDbCollection = require('../../../utils/compare-db-collection');

const MockDate = require('mockdate');

describe('helpers.memberships.getMembershipThatNeedsPayment', async function () {

    let memberships;

    let paymentSubscriptions;

    it('should return one membership that needs payment.', async () => {

        await Membership.destroy({});
        await PaymentSubscription.destroy({});

        MockDate.reset();

        memberships = await Membership.createEach([
            {
                user: fixtures.userAlice.id,
                paid_until: moment().subtract(1, 'day').format('YYYY-MM-DD'),
                client: testClientId,
                status: 'active'
            },
            {
                user: fixtures.userAlice.id,
                paid_until: moment().format('YYYY-MM-DD'),
                client: testClientId,
                status: 'active'
            },
            {
                user: fixtures.userAlice.id,
                paid_until: moment().subtract(10, 'day').format('YYYY-MM-DD'),
                client: testClientId,
                status: 'cancelled_running',
                cancelled_from_date: moment().format('YYYY-MM-DD'),
            },
            {
                user: fixtures.userAlice.id,
                paid_until: moment().subtract(1, 'day').format('YYYY-MM-DD'),
                client: testClientId,
                status: 'ended'
            },
            {
                user: fixtures.userAlice.id,
                paid_until: moment().subtract(1, 'day').format('YYYY-MM-DD'),
                client: testClientId,
                status: 'active',
                renewal_failed: true
            },
            {
                user: fixtures.userAlice.id,
                paid_until: moment().subtract(1, 'day').format('YYYY-MM-DD'),
                client: testClientId,
                status: 'active',
                archived: true
            },
            {
                user: fixtures.userAlice.id,
                paid_until: moment().subtract(1, 'day').format('YYYY-MM-DD'),
                client: testClientId,
                status: 'active',
                automatic_payment_processing_started: true
            },
            {
                // No payment subscriptions
                user: fixtures.userAlice.id,
                paid_until: moment().subtract(1, 'day').format('YYYY-MM-DD'),
                client: testClientId,
                status: 'active'
            },
            {
                // Archived payment subscriptions
                user: fixtures.userAlice.id,
                paid_until: moment().subtract(1, 'day').format('YYYY-MM-DD'),
                client: testClientId,
                status: 'active'
            },
            {
                // Ended payment subscription
                user: fixtures.userAlice.id,
                paid_until: moment().subtract(1, 'day').format('YYYY-MM-DD'),
                client: testClientId,
                status: 'active'
            },
            {
                // The other valid option
                user: fixtures.userAlice.id,
                paid_until: moment().subtract(1, 'day').format('YYYY-MM-DD'),
                client: testClientId,
                status: 'cancelled_running',
                cancelled_from_date: moment().add(1,'day').format('YYYY-MM-DD'),
            },
        ]).fetch();

        paymentSubscriptions = await PaymentSubscription.createEach([
            {
                membership: memberships[0].id,
                status: 'active'
            },
            {
                membership: memberships[1].id,
                status: 'active'
            },
            {
                membership: memberships[2].id,
                status: 'active'
            },
            {
                membership: memberships[3].id,
                status: 'active'
            },
            {
                membership: memberships[4].id,
                status: 'active'
            },
            {
                membership: memberships[5].id,
                status: 'active'
            },
            {
                membership: memberships[6].id,
                status: 'active'
            },
            {
                membership: memberships[8].id,
                status: 'active',
                archived: true
            },
            {
                membership: memberships[9].id,
                status: 'stopped'
            },
            {
                membership: memberships[10].id,
                status: 'active'
            },

        ]).fetch();

        const result = await sails.helpers.memberships.getMembershipThatNeedsPayment();        

        console.log('result = ', result, memberships[0].id);

        comparePartialObject(
            result,
            {
                id: memberships[0].id
            },
        );

        await Membership.destroy({id: memberships[0].id});

        const result2 = await sails.helpers.memberships.getMembershipThatNeedsPayment();

        console.log('result = ', result2, memberships[10].id);

        comparePartialObject(
            result2,
            {
                id: memberships[10].id
            },
        );

        await PaymentSubscription.destroy({
            id: _.map(paymentSubscriptions, 'id')
        });

        await Membership.destroy({
            id: _.map(memberships, 'id')
        });

    });

    it('should return null if there are no memberships that require payment', async () => {

        await Membership.destroy({});

        const result = await sails.helpers.memberships.getMembershipThatNeedsPayment();

        assert.equal(
            result,
            null
        );

    });


});
