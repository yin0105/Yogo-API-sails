module.exports = {

  admin: true,

  async customer(req) {
    const classPassType = await ClassPassType.findOne(req.body.class_pass_type);

    if (classPassType.price > 0) return false;

    if (parseInt(req.body.user) !== parseInt(req.user.id)) return false;

    if (!classPassType.limited_number_per_customer) return true;

    const existingClassPasses = await ClassPass.find({
      class_pass_type: req.body.class_pass_type,
      user: req.user.id,
      archived: false,
    });

    return existingClassPasses.length < classPassType.max_number_per_customer;

  },

};
