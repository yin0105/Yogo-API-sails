module.exports = {
  friendlyName: 'Populate teacher ical feed url',

  inputs: {
    users: {
      type: 'ref',
      required: true,
    },
  },

  fn: async (inputs, exits) => {

    if (!inputs.users.length) {
      return exits.success([])
    }

    if (typeof inputs.users[0].teacher_ical_feed_url !== 'undefined') {
      return exits.success()
    }

    const apiRoot = sails.config.baseUrl

    for (let i = 0; i < inputs.users.length; i++) {

      const user = inputs.users[i];

      user.teacher_ical_feed_url = `${apiRoot}/classes/ical-feed/teacher/${user.id}?client=${user.client}&teacherIcalToken=${user.teacher_ical_token}`

    }

    return exits.success()

  },
}
