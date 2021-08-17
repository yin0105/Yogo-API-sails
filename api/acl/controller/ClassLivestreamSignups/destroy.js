const moment = require('moment-timezone')

module.exports = {

  admin: async (req) => {

    const classLivestreamSignup = await ClassLivestreamSignup.findOne(req.param('id')).populate('class')

    if (parseInt(classLivestreamSignup.client) !== parseInt(req.client.id)) return false

    const classStartString = moment(classLivestreamSignup.class.date).format('YYYY-MM-DD') + ' ' + classLivestreamSignup.class.start_time
    const classStart = moment.tz(classStartString, 'Europe/Copenhagen')

    if (moment().tz('Europe/Copenhagen').isAfter(classStart, 'day')) {
      const e = new Error()
      e.code = 'classHasStarted'
      throw e
    }

    return true

  },

  teacher: async (req) => {
    const classLivestreamSignup = await ClassLivestreamSignup.findOne(req.param('id'))
    const classObj = (await Class.findOne({id: classLivestreamSignup.class}).populate('teachers')).toJSON();

    if (!req.user.teacher_can_manage_all_classes && !req.user.admin) {
      if (!_.find(classObj.teachers, {id: req.user.id})) {
        return false;
      }
    }

    if (moment.tz('Europe/Copenhagen').isAfter(moment.tz(classObj.date, 'Europe/Copenhagen'), 'day')) {
      sails.helpers.error.throwWithCode('classHasStarted');
    }

    return true

  },

  customer: async (req) => {

    const classLivestreamSignup = await ClassLivestreamSignup.findOne(req.param('id')).populate('class');

    if (parseInt(classLivestreamSignup.user) !== parseInt(req.user.id)) return false

    const classStartString = moment(classLivestreamSignup.class.date).format('YYYY-MM-DD') + ' ' + classLivestreamSignup.class.start_time
    const classStart = moment.tz(classStartString, 'Europe/Copenhagen')

    if (moment().isSameOrAfter(classStart, 'minute')) {
      sails.helpers.error.throwWithCode('classHasStarted');
    }

    return true

  },

}
