module.exports = {

  async customer(req) {
    const classItem = await Class.findOne(req.body.classId).populate(
      'livestream_signups',
      {archived: false, cancelled_at: 0},
    );
    return !!_.find(classItem.livestream_signups, signup => parseInt(signup.user) === parseInt(req.user.id));
  },

  async teacher(req) {
    if (req.user.teacher_can_manage_all_classes || req.user.admin) {
      const classItem = await Class.findOne(req.body.classId);
      return parseInt(req.client.id) === parseInt(classItem.client);
    } else {
      const classItem = await Class.findOne(req.body.classId).populate('teachers', {archived: false});
      return !!_.find(classItem.teachers, teacher => parseInt(teacher.id) === parseInt(req.user.id));
    }
  },

  async admin(req) {
    const classItem = await Class.findOne(req.body.classId);
    return parseInt(req.client.id) === parseInt(classItem.client);
  },

};
