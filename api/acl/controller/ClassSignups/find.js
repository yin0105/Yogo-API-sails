module.exports = {

  admin: async (req) => {
    if (req.query.user) {

      const user = await User.findOne(req.query.user)
      return parseInt(user.client) === parseInt(req.client.id)

    } else if (req.query.class) {

      const classItem = await Class.findOne(req.query.class)
      return parseInt(classItem.client) === parseInt(req.client.id)

    } else {

      const e = new Error('User or class must be specified')
      e.code = 'badRequest'
      throw e

    }
  },

  customer: async (req) => {

    if (req.query.user) {

      return parseInt(req.query.user) === parseInt(req.user.id)

    } else {

      const e = new Error('User or class must be specified')
      e.code = 'badRequest'
      throw e

    }
  },

}
