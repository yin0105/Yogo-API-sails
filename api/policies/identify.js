/**
 * acl
 *
 * @description :: Policy to check if user can access the requested resource
 * @help        :: See http://sailsjs.org/#!/documentation/concepts/Policies
 */

const moment = require('moment');

module.exports = function (req, res, next) {

    //console.log('req.tokenPayload', req.tokenPayload);

    if (!req.tokenPayload) {
        // Not authorized and that's ok
        //console.log('Not authorized')
        return next();
    }

    if (req.tokenPayload.checkin) {
        if(parseInt(req.tokenPayload.client) === parseInt(req.client.id) && moment(req.tokenPayload.date).isSame(moment(), 'day')) {
            req.checkin = true;
            return next();
        }
        //console.log('Checkin token outdated or has wrong client. Continue as if not logged in');
        return next();
    }

    User.findOne({id: req.tokenPayload.id})

        .then(function (user) {

            // user can be null and that's ok. That just means that user is not logged in, perhaps the token expired.
            if (!user) {
                return next()
            }

            req.user = user;

            //console.log('user', user);
            //console.log('req.client', req.client);

            if (parseInt(user.client) !== parseInt(req.client.id)) {
                //console.log('req.user.id, req.client.id:', req.user.id, req.client.id);
                return res.json(401, {err: 'Token is not valid for this client'})

            }

            return next();

        })

        .catch(function (err) {
            return res.serverError(err);
        });


};
