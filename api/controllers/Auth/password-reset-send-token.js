module.exports = async function (req, res) {

  const email = req.body.email;
  if (!email) {
    return res.badRequest('Please specify an email');
  }

  let setNewPasswordLink;

  if (req.body.setNewPasswordLink) {
    setNewPasswordLink = decodeURIComponent(req.body.setNewPasswordLink);
  } else {
    const domain = (await Domain.find({client: req.client.id, archived: false}).limit(1))[0];

    // TODO: A better solution than the following hardcoded link
    setNewPasswordLink = 'https://' + domain.name + '/frontend/index.html#/nulstil-password/{email}/{token}';
  }


  let user = await User.find({
    email: email,
    client: req.client.id,
    archived: false,
  });


  if (!_.isArray(user)) {
    return res.serverError('Error while looking up email');
  }

  if (user.length < 1) {
    const errorResponse = await sails.helpers.applicationError.buildResponse('emailNotFound', req);
    return res.ok(errorResponse);
  }

  if (user.length > 1) {
    return res.serverError('Email found more than once.');
  }

  user = user[0];

  await sails.helpers.email.customer.passwordReset(user, setNewPasswordLink);

  return res.ok();


};
