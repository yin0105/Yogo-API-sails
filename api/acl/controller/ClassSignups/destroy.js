const moment = require('moment-timezone')

module.exports = {

  admin: async (req) => {
    const classSignup = await ClassSignup.findOne(req.param('id')).populate('class')
    if (parseInt(classSignup.client) !== parseInt(req.client.id)) return false

    const classStartString = moment(classSignup.class.date).format('YYYY-MM-DD') + ' ' + classSignup.class.start_time
    const classStart = moment.tz(classStartString, 'Europe/Copenhagen')
    if (moment().tz('Europe/Copenhagen').isAfter(classStart, 'day')) {
      const e = new Error()
      e.code = 'classHasStarted'
      throw e
    }

    return true

  },

  teacher: async (req) => {
    const classSignup = await ClassSignup.findOne(req.param('id'))
    const classObj = (await Class.findOne({id: classSignup.class}).populate('teachers')).toJSON();

    if (!req.user.teacher_can_manage_all_classes && !req.user.admin) {
      if (!_.find(classObj.teachers, {id: req.user.id})) {
        return false;
      }
    }

    if (moment.tz('Europe/Copenhagen').isAfter(moment.tz(classObj.date, 'Europe/Copenhagen'), 'day')) {
      const e = new Error()
      e.code = 'classHasStarted'
      throw e
    }

    return true

  },

  customer: async (req) => {

    const classSignup = await ClassSignup.findOne(req.param('id')).populate('class')

    if (parseInt(classSignup.user) !== parseInt(req.user.id)) return false

    const classStartString = moment(classSignup.class.date).format('YYYY-MM-DD') + ' ' + classSignup.class.start_time
    const classStart = moment.tz(classStartString, 'Europe/Copenhagen')

    if (moment().isSameOrAfter(classStart, 'minute')) {
      const e = new Error()
      e.code = 'classHasStarted'
      throw e
    }

    return true

  },

}
