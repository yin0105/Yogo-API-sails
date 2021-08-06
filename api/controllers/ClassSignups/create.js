module.exports = async function (req, res) {

  const can = await sails.helpers.can2('controller.ClassSignups.create', req)
    .tolerate('classHasStarted', async () => {
      const errorResponse = await sails.helpers.applicationError.buildResponse('classHasStarted', req);
      res.ok(errorResponse);
      return null;
    })
    .tolerate('signupDeadlineHasBeenExceeded', async () => {
      const errorResponse = await sails.helpers.applicationError.buildResponse('signupDeadlineHasBeenExceeded', req);
      res.ok(errorResponse);
      return null;
    });

  if (can === null) return;
  if (can === false) return res.forbidden();

  // Customers can not set checked_in
  if (!_.includes(
    ['admin', 'teacher', 'checkin'],
    req.authorizedRequestContext)
  ) {
    req.body.checked_in = false;
  }

  let result = await sails.helpers.classes.createSignup.with({
    user: req.body.user,
    classItem: req.body.class,
    checkCustomerIn: req.body.checked_in,
    allowOverbooking: req.authorizedRequestContext === 'admin' || req.authorizedRequestContext === 'teacher',
    classpass_com_reservation_id: req.body.classpass_com_reservation_id,
  })
    .tolerate('alreadySignedUp', async () => {
      const errorResponse = await sails.helpers.applicationError.buildResponse('alreadySignedUp', req);
      res.ok(errorResponse);
      return false;
    })
    .tolerate('classCancelled', async () => {
      const errorResponse = await sails.helpers.applicationError.buildResponse('classCancelled', req);
      res.ok(errorResponse);
      return false;
    })
    .tolerate('classIsFull', async () => {
      const errorResponse = await sails.helpers.applicationError.buildResponse('classIsFull', req);
      res.ok(errorResponse);
      return false;
    })
    .tolerate('noAccess', async () => {
      const errorResponse = await sails.helpers.applicationError.buildResponse('noAccess', req);
      res.ok(errorResponse);
      return false;
    });

  if (!result) return;

  if (result.used_class_pass || result.used_class_pass_id) {
    const classPassId = sails.helpers.util.idOrObjectIdInteger(result.used_class_pass_id || result.used_class_pass);
    const classPass = await ClassPass.findOne(classPassId).populate('class_pass_type');
    if (classPass.class_pass_type.pass_type === 'fixed_count') {
      const classDescription = await sails.helpers.classes.getDescription(result.class_id || result.class);
      let logMessage = sails.helpers.t(
        'classPassLog.classPassUsedToSignUpForClass',
        [classDescription, classPass.classes_left],
      );
      await sails.helpers.classPassLog.log(classPass, logMessage);
    }
  }

  return res.json(result);

};
