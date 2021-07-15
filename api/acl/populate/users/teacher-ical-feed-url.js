module.exports = {
  admin: true,

  teacher: (req) => {
    const userId = req.user.id;
    if (_.isArray(req.query.id)) {
      return req.query.id.length === 1 && req.query.id[0] == userId;
    } else {
      return req.query.id == userId;
    }
  },
};
