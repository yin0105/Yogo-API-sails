/**
 * stopMembershipWithNoPaymentMethodAndExpired.js
 *
 * @param options
 * @returns {Promise<*>}
 */

const moment = require('moment');

module.exports = async () => {

    let membershipThatNeedsStopping = await SqlService.nativeQuery('getMembershipWithNoPaymentMethodsAndExpired');

    if (!membershipThatNeedsStopping || !membershipThatNeedsStopping.length) return false;

    membershipThatNeedsStopping = membershipThatNeedsStopping[0];

    // Use transaction to make sure that membership is only processed once
    const actionTaken = await sails.getDatastore().transaction(async (dbConnection, proceed) => {

        const membership = SqlService.getLockedRowForUpdate({
            table: 'membership',
            rowId: membershipThatNeedsStopping.id,
            dbConnection: dbConnection
        });

        // Now that we have a db lock on the membership, check that it still needs to be stopped

        const deadlineForStoppingMembership = moment(membership.paid_until).add(14, 'day');
        const paymentSubscriptions = await PaymentSubscription.find({
            membership: membershipThatNeedsStopping.id,
            status: 'active',
        }).usingConnection(dbConnection);

        if (
            membership.status !== 'active' ||
            moment().isBefore(deadlineForStoppingMembership, 'day') ||
            paymentSubscriptions.length
        ) return proceed(null, false);

        await Membership.update({id: membershipThatNeedsStopping.id}, {
            status: 'ended'
        }).usingConnection(dbConnection);

        return proceed(null, true)

    });

    if (!actionTaken) return false;

    await MembershipLog.log(
        membershipThatNeedsStopping.id,
        'Medlemskab udløbet. Der var gået 14 dage efter betalt tidsrum og der var ikke nogen betalingsmetode.'
    );

    return true

};
