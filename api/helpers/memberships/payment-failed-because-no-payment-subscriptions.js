const currencyDkk = require('../../filters/currency_dkk')
module.exports = {

  friendlyName: 'Membership renewal failed because there is no payment subscriptions',

  description: 'Sends email and updates system accordingly.',

  inputs: {
    membership: {
      type: 'ref',
      required: true
    },
  },

  fn: async (inputs, exits) => {

    const membershipId = sails.helpers.util.idOrObjectIdInteger(inputs.membership)

    await sails.helpers.cron.log('Payment for membership ' + membershipId + ' failed because no payment subscription')

    const membership = await Membership.findOne(membershipId).populate('payment_option').populate('user').populate('client')

    const paymentFailedIndex = parseInt(membership.renewal_failed) + 1

    const membershipNumberOfFailedPaymentAttemptsBeforeTermination = await sails.helpers.clientSettings.find(
      membership.client,
      'membership_number_of_failed_payment_attempts_before_termination'
    )

    const terminateMembership = paymentFailedIndex >= membershipNumberOfFailedPaymentAttemptsBeforeTermination

    if (terminateMembership) {
      await Membership.update({
        id: membership.id,
      }, {
        status: 'ended',
        ended_because: 'payment_failed',
        renewal_failed: paymentFailedIndex,
        renewal_failed_last_time_at: Date.now(),
      })

      await MembershipLog.create({
        membership: membership.id,
        user: membership.user.id,
        client: membership.client.id,
        entry: `Fornyelse af medlemskab fejlede for ${paymentFailedIndex}. gang. Der kunne ikke trækkes ${currencyDkk(membership.payment_option.payment_amount)} kr. fordi der ikke er noget betalingskort. Fornyelse er fejlet ${paymentFailedIndex} gange og medlemskabet er nu afsluttet.`,
      })

    } else {

      await Membership.updateOne({
        id: membership.id,
      }).set({
        renewal_failed: paymentFailedIndex,
        renewal_failed_last_time_at: Date.now(),
      })

      await MembershipLog.create({
        membership: membership.id,
        user: membership.user.id,
        client: membership.client.id,
        entry: `Fornyelse af medlemskab fejlede for ${paymentFailedIndex}. gang. Der kunne ikke trækkes ${currencyDkk(membership.payment_option.payment_amount)} kr. fordi der ikke er noget betalingskort.`,
      })

    }

    await sails.helpers.email.customer.membershipRenewalFailed(membership.id)

    return exits.success()

  }

}
