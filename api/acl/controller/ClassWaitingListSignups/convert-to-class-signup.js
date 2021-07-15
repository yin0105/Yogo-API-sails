module.exports = {

  admin: async (req) => {
    const classWaitingListSignup = await ClassWaitingListSignup.findOne(req.param('id'))
    return parseInt(classWaitingListSignup.client) === parseInt(req.client.id)
  },

  teacher: async (req) => {
    if (req.user.teacher_can_manage_all_classes || req.user.admin) return true;

    const classSignup = await ClassWaitingListSignup.findOne(req.param('id'))
    const classObj = (await Class.findOne({id: classSignup.class}).populate('teachers')).toJSON();

    return !!_.find(classObj.teachers, {id: req.user.id});
  },

}
