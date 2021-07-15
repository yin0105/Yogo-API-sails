const moment = require('moment');
const jwToken = require('../../services/jwTokens');

module.exports = async function (req, res) {

    try {
        const email = req.body.email;
        const password = req.body.password;

        if (!email || !password) {
            return res.badRequest('email and password required');
        }

        const users = await User.find({email: email, client: req.client.id, archived: false});

        if (!_.isArray(users) || users.length === 0) {
            return res.ok('E_LOGIN_FAILED');
        }

        if (users.length > 1) {
            return res.serverError('More than one user with same email');
        }

        const user = users[0];

        const valid = await User.comparePassword(password, user);

        if (!valid) {
            return res.ok('E_LOGIN_FAILED');
        }

        // Check that user is allowed to open checkin screen
        if (!user.checkin && !user.admin) {
            return res.ok('E_USER_CAN_NOT_OPEN_CHECKIN');
        }

        return res.json({
            token: jwToken.issue({
                checkin: true,
                client: req.client.id,
                date: moment().format('YYYY-MM-DD')
            })
        });

    } catch (err) {

        return res.serverError(err);

    }

};
