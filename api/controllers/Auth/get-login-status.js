const moment = require('moment');

module.exports = async function(req, res) {

    if (req.user) {
        return res.json({
            status: 'LOGGED_IN',
            user: req.user
        })
    } else if (req.checkin) {
        return res.json({
            status: 'CHECKIN'
        });
    } else {
        return res.json({
            status: 'NOT_LOGGED_IN'
        })
    }

};
