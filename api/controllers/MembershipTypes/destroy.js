module.exports = async function (req, res) {

  const membershipType = await MembershipType.findOne(req.param('id'))

  await MembershipType.update({id: req.param('id')}, {archived: true})

  if (membershipType.image) {
    await Image.update({id: membershipType.image}, {archived: true})
  }

  await MembershipTypePaymentOption.update({membership_type: membershipType.id}, {archived: true})

  return res.ok()

}

