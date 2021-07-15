/**
 * stopCancelledAndExpiredMembership.js
 *
 */


const moment = require('moment');
const cronLog = sails.helpers.cron.log

module.exports = async () => {

    const sql = require('./sql/getCancelledMembershipThatNeedsStopping.sql');
    let membershipThatNeedsStopping = (await sails.sendNativeQuery(sql)).rows;

    if (!membershipThatNeedsStopping || !membershipThatNeedsStopping.length) return false;

    membershipThatNeedsStopping = membershipThatNeedsStopping[0];

    const membershipId = membershipThatNeedsStopping.id;

    await cronLog('Found membership that needs to be stopped. Id: ' + membershipId);

    // Use transaction to make sure that membership is only processed once
    const doStopMembership = await sails.getDatastore().transaction(async (dbConnection, proceed) => {

        const membership = await SqlService.getLockedRowForUpdate({
            table: 'membership',
            rowId: membershipId,
            dbConnection: dbConnection
        });

        // Now that we have a db lock on the membership, check that it still needs to be stopped

        if (
            membership.status !== 'cancelled_running' ||
            moment(membership.cancelled_from_date).isAfter(moment(), 'day') ||
            membership.automatic_payment_processing_started
        ) {
            // Membership not relevant anyway
            return proceed(null, false);
        }

        await Membership.update({
            id: membershipId
        }, {
            automatic_payment_processing_started: true
        }).usingConnection(dbConnection);

        return proceed(null, true)

    });

    await cronLog('doStopMembership:' + doStopMembership);

    if (!doStopMembership) return false;

    // Stop membership
    await Membership.update({id: membershipId}, {
        status: 'ended'
    });

    // Log event
    await MembershipLog.log(
        membershipId,
        'Opsagt medlemskab udløbet og stoppet.'
    );

    await Membership.update({
        id: membershipId
    }, {
        automatic_payment_processing_started: false
    });

    // Send email
    await sails.helpers.email.customer.yourCancelledMembershipHasEnded(membershipId);

    return true

};
