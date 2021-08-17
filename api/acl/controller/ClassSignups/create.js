const moment = require('moment-timezone')

module.exports = {

  admin: async (req) => {
    const classSignupUser = await User.findOne({id: req.body.user})
    if (parseInt(classSignupUser.client) !== parseInt(req.client.id)) {
      return false
    }

    const classItem = await Class.findOne({id: req.body.class})
    const classStartString = moment(classItem.date).tz('Europe/Copenhagen').format('YYYY-MM-DD') + ' ' + classItem.start_time
    const classStart = moment.tz(classStartString, 'Europe/Copenhagen')

    if (moment().tz('Europe/Copenhagen').isAfter(classStart, 'day')) {
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

    const classItem = await Class.findOne({id: req.body.class})
    const classStartString = moment(classItem.date).tz('Europe/Copenhagen').format('YYYY-MM-DD') + ' ' + classItem.start_time
    const classStart = moment.tz(classStartString, 'Europe/Copenhagen')

    // Customers can sign up until class start, except via the checkin interface, where there can be an additional window after class has started.
    const {
      checkin_classes_are_visible_until,
      checkin_classes_are_visible_for_minutes_after_start,
      private_class_signup_deadline,
    } = await sails.helpers.clientSettings.find.with({
      client: req.client.id,
      keys: [
        'checkin_classes_are_visible_until',
        'checkin_classes_are_visible_for_minutes_after_start',
        'private_class_signup_deadline'
      ],
    })

    if (parseInt(classItem.seats) === 1) {
      const classDateString = moment(classItem.date).tz('Europe/Copenhagen').format('YYYY-MM-DD')
      const classStart = moment.tz(classDateString + ' ' + classItem.start_time, 'Europe/Copenhagen')
      const classSignupDeadline = moment(classStart).subtract(private_class_signup_deadline, 'minutes')
      if (moment().isSameOrAfter(classSignupDeadline, 'minutes')) {
        const e = new Error()
        e.code = 'signupDeadlineHasBeenExceeded'
        throw e
      }
    }

    const checkinExtraMinutes = checkin_classes_are_visible_until === 'minutes_after_class_start' ?
      checkin_classes_are_visible_for_minutes_after_start :
      0

    const customerCreateSignupDeadline = moment(classStart).add(checkinExtraMinutes, 'minutes')

    if (moment().tz('Europe/Copenhagen').isAfter(customerCreateSignupDeadline, 'minute')) {
      const e = new Error()
      e.code = 'classHasStarted'
      throw e
    }

    return true
  },

}
