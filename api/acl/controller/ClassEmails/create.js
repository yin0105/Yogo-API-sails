module.exports = {
  admin: true,

  teacher: async (req, inputs) => {
    if (req.user.teacher_can_manage_all_classes || req.user.admin) {
      return true;
    }
    const classObj = await Class.findOne({id: inputs.class_id}).populate('teachers')
    return !!_.find(classObj.teachers, {id: req.user.id})
  }
}
