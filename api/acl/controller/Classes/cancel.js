module.exports = {

  admin: async req => {
    const classItem = await Class.findOne(req.param('id'))

    if (!classItem) return false

    return parseInt(classItem.client) === parseInt(req.client.id)
  },

}
