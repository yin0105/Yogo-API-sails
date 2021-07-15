module.exports = async function (req, res) {

  const can = await sails.helpers.can2('controller.ClassWaitingListSignups.create', req)
    .tolerate('waitingListDisabled', async () => {
      const errorResponse = await sails.helpers.applicationError.buildResponse('waitingListDisabled', req);
      res.ok(errorResponse)
      return null
    })
    .tolerate('privateClassWaitingListDisabled', async () => {
      const errorResponse = await sails.helpers.applicationError.buildResponse('privateClassWaitingListDisabled', req);
      res.ok(errorResponse)
      return null
    })
    .tolerate('classIsOpen', async () => {
      const errorResponse = await sails.helpers.applicationError.buildResponse('classIsOpen', req);
      res.ok(errorResponse)
      return null
    })
    .tolerate('classHasStarted', async () => {
      const errorResponse = await sails.helpers.applicationError.buildResponse('classHasStarted', req);
      res.ok(errorResponse)
      return null
    })
    .tolerate('signupDeadlineHasBeenExceeded', async () => {
      const errorResponse = await sails.helpers.applicationError.buildResponse('signupDeadlineHasBeenExceeded', req);
      res.ok(errorResponse)
      return null
    })
    .tolerate('signoffDeadlineHasBeenExceeded', async () => {
      // Waiting lists are purged at signoff deadline
      const errorResponse = await sails.helpers.applicationError.buildResponse('signoffDeadlineHasBeenExceeded', req);
      res.ok(errorResponse)
      return null
    })

  if (can === null) return
  if (can === false) return res.forbidden()


  let result = await sails.helpers.classes.createWaitingListSignup.with({
    user: req.body.user,
    classItem: req.body.class,
  })
    .tolerate('alreadySignedUp', async () => {
      const errorResponse = await sails.helpers.applicationError.buildResponse('alreadySignedUp', req);
      res.ok(errorResponse)
      return false
    })
    .tolerate('alreadySignedUpForWaitingList', async () => {
      const errorResponse = await sails.helpers.applicationError.buildResponse('alreadySignedUpForWaitingList', req);
      res.ok(errorResponse)
      return false
    })
    .tolerate('classCancelled', async () => {
      const errorResponse = await sails.helpers.applicationError.buildResponse('classCancelled', req);
      res.ok(errorResponse)
      return false
    })
    .tolerate('waitingListIsFull', async () => {
      const errorResponse = await sails.helpers.applicationError.buildResponse('waitingListIsFull', req);
      res.ok(errorResponse)
      return false
    })
    .tolerate('classIsNotFull', async () => {
      const errorResponse = await sails.helpers.applicationError.buildResponse('classIsNotFull', req);
      res.ok(errorResponse)
      return false
    })
    .tolerate('noAccess', async () => {
      const errorResponse = await sails.helpers.applicationError.buildResponse('noAccess', req);
      res.ok(errorResponse)
      return false
    })

  if (!result) return;

  if (result.used_class_pass || result.used_class_pass_id) {
    const classPassId = sails.helpers.util.idOrObjectIdInteger(result.used_class_pass_id || result.used_class_pass);
    const classPass = await ClassPass.findOne(classPassId).populate('class_pass_type');
    if (classPass.class_pass_type.pass_type === 'fixed_count') {
      const classDescription = await sails.helpers.classes.getDescription(result.class_id || result.class);
      const logMessage = sails.helpers.t(
        'classPassLog.classPassUsedToSignUpForWaitingListForClass',
        [classDescription, classPass.classes_left],
      );
      await sails.helpers.classPassLog.log(classPass, logMessage);
    }
  }

  return res.json(result)

}
