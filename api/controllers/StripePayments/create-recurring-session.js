module.exports = async function (req, res) {

  if (!await sails.helpers.can2('controller.StripePayments.create-recurring-session', req)) {
    return exits.forbidden()
  }

  const recurringSession = await sails.helpers.paymentProvider.stripe.createRecurringSession.with({
    user: req.user.id,
    amount: req.param('amount')
  })

  console.log("recurringSession = ", recurringSession);

  return res.ok(recurringSession)

}
