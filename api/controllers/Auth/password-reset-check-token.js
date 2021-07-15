module.exports = async function (req, res) {

  const email = req.body.email;
  if (!email) {
    return res.badRequest('Please specify an email');
  }

  const token = req.body.token;
  if (!token) {
    return res.badRequest('Please specify a token');
  }


  let user = await User.find({client: req.client.id, email: email, archived: false});
  if (!user || !user.length) {
    const errorResponse = await sails.helpers.applicationError.buildResponse('emailNotFound', req);
    return res.ok(errorResponse);
  }
  if (user.length > 1) {
    return res.serverError('Too many users with that email');
  }

  user = user[0];

  if (user.reset_password_token !== token) {
    const errorResponse = await sails.helpers.applicationError.buildResponse('invalidToken', req);
    return res.ok(errorResponse);
  }

  if (user.reset_password_token_expires < (new Date()).getTime() / 1000) {
    const errorResponse = await sails.helpers.applicationError.buildResponse('tokenExpired', req);
    return res.ok(errorResponse);
  }

  return res.ok();

};
