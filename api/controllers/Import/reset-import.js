module.exports = async (req, res) => {

  await ClassSignup.destroy({
    client: req.client.id,
  })

  await ClassPass.destroy({
    client: req.client.id,
  })

  await Membership.destroy({
    client: req.client.id
  })

  await MembershipLog.destroy({
    client: req.client.id
  })

  await PaymentSubscription.destroy({
    client: req.client.id
  })

  await EventSignup.destroy({
    client: req.client.id
  })

  await User.destroy({
    client: req.client.id,
    admin: false,
    teacher: false,
    checkin: false,
  })

  return res.ok()

}
