module.exports = {

  admin: true,

  teacher: true,

  customer(req) {
    const singleId = _.isNumber(req.query.id) ? req.query.id : req.param('id')
    return parseInt(singleId) === parseInt(req.user.id)
  },

  public(req) {
    // Teacher list is public
    return !!req.query.teacher || !!req.query.isTeachingVideo
  }
}
