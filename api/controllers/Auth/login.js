const jwToken = require('../../services/jwTokens');

module.exports = async function (req, res) {

  const email = req.param('email');
  const password = req.param('password');

  if (!email || !password) {
    return res.badRequest('email and password required');
  }

  let userQuery = await User.find({email: email, client: req.client.id, archived: false});

  if (req.query.populate && req.query.populate === 'image') userQuery.populate('image');


  let users = await userQuery;

  if (!_.isArray(users) || users.length === 0) {
    const errorResponse = await sails.helpers.applicationError.buildResponse('loginFailed', req);
    return res.ok(errorResponse);
  }

  if (users.length > 1) {
    return res.serverError('More than one user with same email');
  }

  const user = users[0];

  const valid = await User.comparePassword(password, user);

  if (!valid) {
    const errorResponse = await sails.helpers.applicationError.buildResponse('loginFailed', req);
    return res.ok(errorResponse);
  }

  // Yay! Login ok!

  // Check that the user has access to the requested area
  if (req.requestContext === 'admin' && !user.admin) {
    return res.ok('E_USER_IS_NOT_ADMIN');
  }
  if (req.requestContext === 'teacher' && !user.teacher) {
    const errorResponse = await sails.helpers.applicationError.buildResponse('userIsNotTeacher', req);
    return res.ok(errorResponse);
  }
  if (req.requestContext === 'frontend' && !user.customer) {
    return res.ok('E_USER_IS_NOT_CUSTOMER');
  }


  await User.update(
    {
      id: user.id,
    },
    {
      reset_password_token: '',
      reset_password_token_expires: 0,
    },
  );

  return res.json({
    user: user,
    token: jwToken.issue({
      id: user.id,
    }),
  });

};
