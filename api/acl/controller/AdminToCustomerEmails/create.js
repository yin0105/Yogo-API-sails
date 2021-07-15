module.exports = {
  admin: true,

  teacher: async (req) => {
    const {teachers: classTeachers} = await Class.findOne({id: req.body.itemId}).populate('teachers');

    return req.body.itemType === 'class'
      && _.chain(classTeachers)
        .map('id')
        .includes(req.user.id)
        .value();
  },

};
