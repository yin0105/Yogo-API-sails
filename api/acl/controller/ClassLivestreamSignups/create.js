const moment = require('moment-timezone')

module.exports = {

  admin: async (req) => {
    const classSignupUser = await User.findOne({id: req.body.user})
    if (parseInt(classSignupUser.client) !== parseInt(req.client.id)) {
      return false
    }

    const classItem = (await Class.findOne({id: req.body.class})).toJSON();
    const classStart = moment.tz(classItem.date, 'Europe/Copenhagen')

    if (moment.tz('Europe/Copenhagen').isAfter(classStart, 'day')) {
      const e = new Error()
      e.code = 'classHasStarted'
      throw e
    }

    return true

  },

  teacher: async (req) => {
    const classSignupUser = await User.findOne({id: req.body.user})
    if (parseInt(classSignupUser.client) !== parseInt(req.client.id)) {
      return false
    }

    const classItem = (await Class.findOne({id: req.body.class}).populate('teachers')).toJSON();

    if (!req.user.teacher_can_manage_all_classes && !req.user.admin) {
      if (!_.find(classItem.teachers, {id: req.user.id})) {
        return false;
      }
    }

    const classStart = moment.tz(classItem.date, 'Europe/Copenhagen')
    if (moment.tz('Europe/Copenhagen').isAfter(classStart, 'day')) {
      const e = new Error()
      e.code = 'classHasStarted'
      throw e
    }

    return true

  },

  customer: async (req) => {
    if (parseInt(req.body.user) !== parseInt(req.user.id)) {
      return false
    }

    const classItem = (await Class.findOne({id: req.body.class})).toJSON();
    const classStart = moment.tz(`${classItem.date} ${classItem.start_time}`, 'Europe/Copenhagen')
    
    if (moment.tz('Europe/Copenhagen').isAfter(classStart, 'minute')) {
      const e = new Error()
      e.code = 'classHasStarted'
      throw e
    }

    return true
  },

}
