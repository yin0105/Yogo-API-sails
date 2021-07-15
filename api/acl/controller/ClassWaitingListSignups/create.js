async function checkDeadlines(classId) {
  const classItem = await Class.findOne({id: classId});
  await sails.helpers.populate.classes.classHasStarted([classItem]);


  if (classItem.class_has_started) {
    const e = new Error();
    e.code = 'classHasStarted';
    throw e;
  }

  await sails.helpers.populate.classes.classSignupDeadlineHasBeenExceeded([classItem]);

  if (classItem.class_signup_deadline_has_been_exceeded) {
    const e = new Error();
    e.code = 'signupDeadlineHasBeenExceeded';
    throw e;
  }

  await sails.helpers.populate.classes.classSignoffDeadlineHasBeenExceeded([classItem]);

  if (classItem.class_signoff_deadline_has_been_exceeded) {
    const e = new Error();
    e.code = 'signoffDeadlineHasBeenExceeded';
    throw e;
  }
}

async function checkWaitingListActive(req) {
  const {
    class_waiting_list_enabled: waitingListActive,
    private_class_waiting_list_enabled: privateClassWaitingListActive,
  } = await sails.helpers.clientSettings.find(
    req.client.id,
    [
      'class_waiting_list_enabled',
      'private_class_waiting_list_enabled',
    ],
  );

  const classItem = await Class.findOne(req.body.class);
  if (classItem.seats > 1 && !waitingListActive) {
    const e = new Error();
    e.code = 'waitingListDisabled';
    throw e;
  }
  if (parseInt(classItem.seats) === 1 && !privateClassWaitingListActive) {
    const e = new Error();
    e.code = 'privateClassWaitingListDisabled';
    throw e;
  }
  if (classItem.seats < 1) {
    const e = new Error();
    e.code = 'classIsOpen';
    throw e;
  }
}

module.exports = {

  admin: async (req) => {
    const classWaitingListSignupUser = await User.findOne({id: req.body.user});
    if (parseInt(classWaitingListSignupUser.client) !== parseInt(req.client.id)) {
      return false;
    }

    await checkDeadlines(req.body.class);

    await checkWaitingListActive(req);

    return true;
  },

  teacher: async (req) => {
    const classObj = await Class.findOne({id: req.body.class}).populate('teachers');

    if (!req.user.teacher_can_manage_all_classes && !req.user.admin) {
      if (!_.find(classObj.teachers, {id: req.user.id})) {
        return false;
      }
    }

    await checkDeadlines(req.body.class);

    await checkWaitingListActive(req);

    return true;
  },


  customer: async (req) => {
    if (parseInt(req.body.user) !== parseInt(req.user.id)) {
      return false;
    }

    await checkDeadlines(req.body.class);

    await checkWaitingListActive(req);

    return true;
  },

};
