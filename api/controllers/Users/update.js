module.exports = async function (req, res) {

  let userData = _.pick(req.body, [
    'first_name',
    'last_name',
    'address_1',
    'address_2',
    'zip_code',
    'city',
    'country',
    'phone',
    'email',
    'date_of_birth',
    'password',
    'image',
    'customer_additional_info',
    'teacher_description',
    'livestream_time_display_mode'
  ])

  if (req.user.admin) {
    _.extend(userData, _.pick(req.body, [
      'teacher',
      'customer',
      'admin',
      'checkin',
      'teacher_can_manage_all_classes',
    ]))
  }

  if (userData.email) {
    const existingUserWithRequestedEmail = await User.find({
      email: userData.email,
      archived: false,
      client: req.client.id,
    })

    if (
      existingUserWithRequestedEmail.length > 1 ||
      (
        existingUserWithRequestedEmail.length === 1 &&
        parseInt(existingUserWithRequestedEmail[0].id) !== parseInt(req.param('id'))
      )
    ) {
      return res.ok('E_EMAIL_EXISTS')
    }
  }

  let currentUser = await User.find(req.param('id'))

  if (currentUser.image && userData.image && currentUser.image !== userData.image) {
    await Image.update({id: currentUser.image}, {archived: true})
  }

  if (userData.image) {
    await Image.update({id: userData.image}, {expires: 0})
  }


  if (userData.password) {
    userData.encrypted_password = await User.getEncryptedPassword(userData.password)
    delete userData.password
  }

  let user = await User.update({id: req.param('id')}, userData).fetch()

  user = user[0]

  return res.json(user)

}
