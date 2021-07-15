const jwToken = require('../../services/jwTokens');

module.exports = async function(req, res) {

    if (!req.query.token) {
        return res.badRequest('No token specified')
    }

    const token = req.query.token

    try {
        jwToken.verify(token, async function (err, tokenPayload) {
            if (err) {
                return res.json({
                    tokenStatus: 'invalid'
                });
            }

            let blacklistedToken = await BlacklistedToken.find({
                token: token
            })

            if (blacklistedToken.length) {
                return res.json({
                    tokenStatus: 'blacklisted'
                });
            }
            return res.json({
                tokenStatus: 'valid',
                userId: tokenPayload.id
            });

        })
    } catch (err) {
        return res.serverError(err)
    }
}
