const assert = require('assert');

const assertAsyncThrows = require('../../../utils/assert-async-throws');
const assertAsyncDbObject = require('../../../utils/assert-async-db-object');

const testClientId = require('../../../global-test-variables').TEST_CLIENT_ID;
const fixtures = require('../../../fixtures/factory').fixtures;

const MockDate = require('mockdate');

describe('helpers.memberships.setAutoPaymentProcessingLock', async function () {

    let membership;

    let paymentSubscription;

    it('should set processing flag if membership needs auto payment', async () => {

        membership = await Membership.create({
            user: fixtures.userAlice.id,
            paid_until: '2018-05-15',
            client: testClientId,
            status: 'active'
        }).fetch();

        paymentSubscription = await PaymentSubscription.create({
            membership: membership.id,
            status: 'active'
        }).fetch();

        MockDate.set('5/16/2018');

        const firstRun = await sails.helpers.memberships.setAutoPaymentProcessingLock(membership);

        assert.equal(
            firstRun,
            true
        );

        await assertAsyncThrows(
            async () => {
                await sails.helpers.memberships.setAutoPaymentProcessingLock(membership);
            },
            'failLockAlreadySet'
        );

        MockDate.reset();

        await PaymentSubscription.destroy({
            id: paymentSubscription.id
        });

        await Membership.destroy({
            id: membership.id
        });

    });


    it('should throw "membershipIsPaidFor" if membership has been paid for', async () => {

        membership = await Membership.create({
            user: fixtures.userAlice.id,
            paid_until: '2018-05-16',
            client: testClientId,
            status: 'active'
        }).fetch();

        paymentSubscription = await PaymentSubscription.create({
            membership: membership.id,
            status: 'active'
        }).fetch();

        MockDate.set('5/16/2018');

        await assertAsyncThrows(
            async () => {
                await sails.helpers.memberships.setAutoPaymentProcessingLock(membership);
            },
            'failMembershipIsPaidFor'
        );

        MockDate.reset();

        await PaymentSubscription.destroy({
            id: paymentSubscription.id
        });

        await Membership.destroy({
            id: membership.id
        });

    });


    it('should throw "membershipArchived" if membership has been archived', async () => {


        membership = await Membership.create({
            user: fixtures.userAlice.id,
            paid_until: '2018-05-15',
            client: testClientId,
            status: 'active',
            archived: true
        }).fetch();

        paymentSubscription = await PaymentSubscription.create({
            membership: membership.id,
            status: 'active'
        }).fetch();

        MockDate.set('5/16/2018');

        await assertAsyncThrows(
            async () => {
                await sails.helpers.memberships.setAutoPaymentProcessingLock(membership);
            },
            'failMembershipArchived'
        );

        MockDate.reset();

        await PaymentSubscription.destroy({
            id: paymentSubscription.id
        });

        await Membership.destroy({
            id: membership.id
        });

    });

    it('should throw "statusNotActiveOrCancelledRunning" if membership has been archived', async () => {


        membership = await Membership.create({
            user: fixtures.userAlice.id,
            paid_until: '2018-05-15',
            client: testClientId,
            status: 'ended'
        }).fetch();

        paymentSubscription = await PaymentSubscription.create({
            membership: membership.id,
            status: 'active'
        }).fetch();

        MockDate.set('5/16/2018');

        await assertAsyncThrows(
            async () => {
                await sails.helpers.memberships.setAutoPaymentProcessingLock(membership);
            },
            'failStatusNotActiveOrCancelledRunning'
        );

        MockDate.reset();

        await PaymentSubscription.destroy({
            id: paymentSubscription.id
        });

        await Membership.destroy({
            id: membership.id
        });

    });

    it('should throw "membershipCancelledAndExpired" if membership has been cancelled and has expired', async () => {

        membership = await Membership.create({
            user: fixtures.userAlice.id,
            paid_until: '2018-05-05',
            cancelled_from_date: '2018-05-16',
            client: testClientId,
            status: 'cancelled_running'
        }).fetch();

        paymentSubscription = await PaymentSubscription.create({
            membership: membership.id,
            status: 'active'
        }).fetch();

        MockDate.set('5/16/2018');

        await assertAsyncThrows(
            async () => {
                await sails.helpers.memberships.setAutoPaymentProcessingLock(membership);
            },
            'failMembershipCancelledAndExpired'
        );

        MockDate.reset();

        await PaymentSubscription.destroy({
            id: paymentSubscription.id
        });

        await Membership.destroy({
            id: membership.id
        });

    });


    it('should throw "renewalFailed" if payment has been tried but failed', async () => {

        membership = await Membership.create({
            user: fixtures.userAlice.id,
            paid_until: '2018-05-05',
            client: testClientId,
            status: 'active',
            renewal_failed: true
        }).fetch();

        paymentSubscription = await PaymentSubscription.create({
            membership: membership.id,
            status: 'active'
        }).fetch();

        MockDate.set('5/16/2018');

        await assertAsyncThrows(
            async () => {
                await sails.helpers.memberships.setAutoPaymentProcessingLock(membership);
            },
            'failRenewalFailed'
        );

        MockDate.reset();

        await PaymentSubscription.destroy({
            id: paymentSubscription.id
        });

        await Membership.destroy({
            id: membership.id
        });

    });


    it('should throw "noPaymentsubscriptions" if there are no active payment subscriptions', async () => {

        membership = await Membership.create({
            user: fixtures.userAlice.id,
            paid_until: '2018-05-05',
            client: testClientId,
            status: 'active'
        }).fetch();

        paymentSubscription = await PaymentSubscription.create({
            membership: membership.id,
            status: 'stopped'
        }).fetch();

        MockDate.set('5/16/2018');

        await assertAsyncThrows(
            async () => {
                await sails.helpers.memberships.setAutoPaymentProcessingLock(membership);
            },
            'failNoPaymentSubscriptions'
        );

        MockDate.reset();

        await PaymentSubscription.destroy({
            id: paymentSubscription.id
        });

        await Membership.destroy({
            id: membership.id
        });

    });


});
