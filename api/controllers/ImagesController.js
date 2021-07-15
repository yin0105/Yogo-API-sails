/**
 * ImagesController
 *
 * @description :: Server-side logic for managing images
 * @help        :: See http://links.sailsjs.org/docs/controllers
 */

const moment = require('moment')

module.exports = {

    async create(req, res) {

        try {

            req.file('image').upload({
                maxBytes: 50000000,
                adapter: require('skipper-s3'),
                key: sails.config.AWS_S3_IMAGE_UPLOAD_ACCESS_KEY_ID,
                secret: sails.config.AWS_S3_IMAGE_UPLOAD_ACCESS_KEY_SECRET,
                bucket: sails.config.AWS_S3_IMAGE_UPLOAD_BUCKET,
                region: 'eu-west-1'

            }, async function (err, uploadedFiles) {


                if (err) {
                    return res.serverError(err);
                }


                let results = await Promise.all(
                    _.map(uploadedFiles, file => Image.create({
                            client: req.client.id,
                            original_filename: file.filename,
                            filename: file.fd,
                            expires: moment().add('1 hour').unix() // If image is not used within an hour, delete it.
                        }).fetch()
                    )
                )


                if (!results || !_.isArray(results)) {
                    return res.serverError('Could not create images in DB')
                }

                return res.json(
                    results[0]
                );

            });

        } catch (err) {
            return res.serverError(err);
        }
    },

    async findOne (req, res) {
        try {
            const image = await Image.findOne(req.params.id)

            return res.json(image);
        } catch (err) {
            return res.serverError(err);
        }
    }

};
