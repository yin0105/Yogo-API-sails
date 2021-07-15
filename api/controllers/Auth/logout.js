module.exports = async function (req, res) {

  if (!req.user && !req.checkin) return res.ok()

  if (req.token) {

    await BlacklistedToken.create({
      token: req.token,
      user: req.user ? req.user.id : null,
    }).fetch()

  }

  return res.ok()

}
