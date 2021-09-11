module.exports = {
  friendlyName: 'Cron tick',

  description: `
  Handles cron tasks. 
  
  The overall idea is that the tick function is called with regular, short intervals. F.ex. 1 minute. 
  
  The tick function only does one thing for each call. This has a couple of advantages. Errors typically won't be as severe. Debugging is easier. And the load on the server is spread out over time and over different servers. 
  
  On the other hand it makes race conditions a very real possibility. To handle this, it is important to take precautions, like locking tables/records, so if one call takes more than one minute, the next call will NOT process the same payment/email/whatever. 
  
  Also it is important to avoid situations where the tick will try to process the same record but fail repeatedly, as this would block other tasks.`,

  fn: async function (inputs, exits) {
    console.log("tick");

    const cronLog = sails.helpers.cron.log
    const idOrObjectIdInteger = sails.helpers.util.idOrObjectIdInteger

    await cronLog('Cron tick')

    try {

      const membershipPaymentProcessed = await sails.helpers.memberships.processOneMembershipPayment()

      if (membershipPaymentProcessed) {
        await cronLog('Action taken: One membership payment processed, for membership ' + idOrObjectIdInteger(membershipPaymentProcessed))
        return exits.success()
      }


      const stoppedCancelledAndExpiredMembership = await MembershipService.stopCancelledAndExpiredMembership()
      if (stoppedCancelledAndExpiredMembership) {
        await cronLog(
          'Action taken: cancelled membership expired and ended: ' + idOrObjectIdInteger(stoppedCancelledAndExpiredMembership),
        )
        return exits.success()
      }


      await sails.helpers.cron.log('No action taken')

      return exits.success()

    } catch (err) {

      await cronLog('Cron error. Type: ' + err.type + ' Code: ' + err.code + ' Message: ' + err.message)

      return exits.error(err)
    }

  },

}
