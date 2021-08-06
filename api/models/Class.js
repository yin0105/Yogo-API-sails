/**
 * Classes.js
 *
 * @description :: TODO: You might write a short summary of how this model works and what it represents here.
 * @docs        :: http://sailsjs.org/documentation/concepts/models-and-orm/models
 */

const moment = require('moment-timezone')
const t = sails.helpers.t

module.exports = {

  attributes: {

    client: {
      model: 'Client',
    },

    date: {
      type: 'ref',
      columnType: 'date',
    },

    start_time: {
      type: 'ref',
      columnType: 'time',
    },

    end_time: {
      type: 'ref',
      columnType: 'time',
    },

    teachers: {
      collection: 'User',
      via: 'teaching_classes',
    },

    class_type: {
      model: 'ClassType',
    },

    subtitle: {
      type: 'String',
    },

    room: {
      model: 'Room',
    },

    seats: {
      type: 'number',
    },

    cancelled: {
      type: 'boolean',
    },

    signups: {
      collection: 'ClassSignup',
      via: 'class',
    },

    waiting_list_signups: {
      collection: 'ClassWaitingListSignup',
      via: 'class'
    },

    class_emails: {
      collection: 'ClassEmail',
      via: 'class_id',
    },

    studio_attendance_enabled: {
      type: 'boolean',
      defaultsTo: true
    },

    livestream_enabled: {
      type: 'boolean',
      defaultsTo: false
    },

    livestream_signups: {
      collection: 'ClassLivestreamSignup',
      via: 'class'
    },

    classpass_com_enabled: {
      type: 'boolean',
      allowNull: true,
    },

    classpass_com_all_seats_allowed: {
      type: 'boolean',
      allowNull: true,
    },

    classpass_com_number_of_seats_allowed: {
      type: 'number',
      allowNull: true,
    },
  },

  customToJSON() {
    this.start_time = this.start_time.substr(0, 5)
    this.end_time = this.end_time.substr(0, 5)

    this.date = moment(this.date).format('YYYY-MM-DD');

    return this
  },

  async populateComplexFields(classes, populateFields, req) {

    if (!classes.length) return

    // THINGS WITH IMAGES
    let imageIds = []
    if (populateFields.teachers && populateFields['teachers.image']) {
      _.each(classes, function (classItem) {
        _.each(classItem.teachers, (teacher) => {
          if (teacher.image) imageIds.push(teacher.image)
        })
      })
    }

    if (populateFields.class_type && populateFields['class_type.image']) {
      _.each(classes, function (classItem) {
        if (classItem.class_type && classItem.class_type.image) imageIds.push(classItem.class_type.image)
      })
    }

    let images = await Image.find({id: imageIds})

    images = _.keyBy(images, 'id')

    _.each(classes, function (classItem) {
      _.each(classItem.teachers, (teacher) => {
        if (teacher.image && images[teacher.image]) {
          teacher.image = images[teacher.image]
        }
      })

      if (classItem.class_type && classItem.class_type.image && images[classItem.class_type.image]) {
        classItem.class_type.image = images[classItem.class_type.image]
      }
    })


    // SIGNUPS
    if (populateFields.signups) {

      let fetchedClasses = await Class.find({id: _.map(classes, 'id')}).populate('signups', {archived: false, cancelled_at: 0})
      fetchedClasses = _.keyBy(fetchedClasses, 'id')


      _.each(classes, classItem => {
        classItem.signups = fetchedClasses[classItem.id].signups
      })

      const signupsPerClass = _.map(fetchedClasses, 'signups')
      const allSignups = _.union(...(signupsPerClass))

      if (populateFields['signups.user']) {
        const allUserIds = _.uniq(_.map(allSignups, 'user'))
        let users = await User.find({id: allUserIds})
        users = _.keyBy(users, 'id')

        _.each(classes, classItem => {
          _.each(classItem.signups, signup => {
            signup.user = users[signup.user]
          })
        })

        if (populateFields['signups.user.image']) {
          const allImageIds = _.compact(_.map(users, 'image'))

          let allImages = await Image.find({id: allImageIds})
          allImages = _.keyBy(allImages, 'id')

          _.each(users, user => {
            user.image = allImages[user.image]
          })
        }
      }

      if (populateFields['signups.used_membership']) {
        const usedMembershipIds = _.uniq(_.compact(_.map(allSignups, 'used_membership')))
        let usedMembershipsQuery = Membership.find({id: usedMembershipIds})
        if (populateFields['signups.used_membership.real_user_image']) {
          usedMembershipsQuery.populate('real_user_image')
        }
        const usedMemberships = _.keyBy(
          await usedMembershipsQuery,
          'id',
        )

        _.each(classes, classItem => {
          _.each(classItem.signups, signup => {
            if (signup.used_membership) {
              signup.used_membership = usedMemberships[signup.used_membership]
            }
          })
        })

      }
    }


    // SIGNUP_COUNT
    if (populateFields.signup_count && classes.length) {

      if (populateFields.signups) {
        _.each(classes, (cls => cls.signup_count = cls.signups.length))
      } else {
        const getSignupCountsSql = require('../sql/ClassesControllerSql/getSignupCounts.sql')
        const signupCountsRaw = await sails.sendNativeQuery(getSignupCountsSql, [_.map(classes, 'id')])

        const signupCounts = _.keyBy(signupCountsRaw.rows, 'id')

        _.each(classes, (cls => cls.signup_count = signupCounts[cls.id].signup_count))
      }

    }

    if (populateFields.capacity_text && classes.length) {

      let signupCountsByClassId
      if (populateFields.signup_count) {
        const classesById = _.keyBy(classes, 'id')
        signupCountsByClassId = _.mapValues(classesById, cls => cls.signup_count)
      } else if (populateFields.signups) {
        const classesById = _.keyBy(classes, 'id')
        signupCountsByClassId = _.mapValues(classesById, cls => cls.signups.length)
      } else {
        const getSignupCountsSql = require('../sql/ClassesControllerSql/getSignupCounts.sql')
        const signupCountsRaw = await sails.sendNativeQuery(getSignupCountsSql, [_.map(classes, 'id')])

        signupCountsByClassId = _
          .chain(signupCountsRaw.rows)
          .keyBy('id')
          .mapValues(row => row.signup_count)
          .value()

      }

      const capacitySettings = await sails.helpers.clientSettings.find(
        req.client,
        [
          'calendar_capacity_info_format',
          'calendar_few_seats_left_warning_text',
          'calendar_few_seats_left_warning_limit',
        ],
      )


      _.each(classes, cls => {

        if (cls.seats === 1) { // Private classes
          if (signupCountsByClassId[cls.id] >= 1) {
            cls.capacity_text = t('capacityText.Booked')
          } else {
            cls.capacity_text = ''
          }
          return true // Continue
        }

        const clsStartString = moment(cls.date).format('YYYY-MM-DD') + ' ' + cls.start_time
        const clsMoment = moment(clsStartString, 'YYYY-MM-DD HH:mm:ss')
        const now = moment().tz('Europe/Copenhagen')
        const hideInfoBecauseClassHasStarted = now.isSameOrAfter(clsMoment)
        if (hideInfoBecauseClassHasStarted) {
          cls.capacity_text = ''
          return true // Continue
        }

        const seatsAvailable = cls.seats - signupCountsByClassId[cls.id]

        switch (capacitySettings.calendar_capacity_info_format) {
          case 'none':
            if (seatsAvailable <= 0) {
              cls.capacity_text = t('capacityText.Fully booked')
            } else {
              cls.capacity_text = ''
            }
            break

          case 'number_of_available_seats':
            if (seatsAvailable <= 0) {
              cls.capacity_text = t('capacityText.Fully booked')
            } else if (seatsAvailable === 1) {
              cls.capacity_text = t('capacityText.1 available seat')
            } else {
              cls.capacity_text = t('capacityText.%s available seats', seatsAvailable)
            }
            break;

          case 'available_slash_total_seats':
            cls.capacity_text = signupCountsByClassId[cls.id] + '/' + cls.seats
            break

          case 'warning_on_few_seats_left':
            if (seatsAvailable <= 0) {
              cls.capacity_text = t('capacityText.Fully booked')
            } else {
              cls.capacity_text = (
                seatsAvailable <= capacitySettings.calendar_few_seats_left_warning_limit &&
                seatsAvailable > 0
              ) ? capacitySettings.calendar_few_seats_left_warning_text : ''
            }
            break
        }
      })

    }

    // Room branches
    if (populateFields.room && populateFields['room.branch']) {
      let branches = await Branch.find({
        client: classes[0].client,
        archived: false,
      })
      branches = _.keyBy(branches, 'id')
      _.each(classes, classItem => {
        if (classItem.room && classItem.room.branch) {
          classItem.room.branch = branches[classItem.room.branch]
        }
      })
    }

    if (populateFields.ics_url) {
      _.each(classes, classItem => {
        classItem.ics_url = sails.config.baseUrl + '/classes/' + classItem.id + '/ics?client=' + classItem.client
      })
    }

  },

}

