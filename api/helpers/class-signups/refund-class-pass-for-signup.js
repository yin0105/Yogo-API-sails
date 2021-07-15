const moment = require('moment');

module.exports = {

    friendlyName: 'Refund class pass for signup',

    description: 'Refunds a class to a fixed_count class pass when the signup is destroyed.',

    inputs: {
        signup: {
            type: 'ref',
            description: 'The signup to check used class pass and refund if relevant.',
            required: true
        },
        signupType: {
          type: 'string',
          isIn: ['studio','livestream'],
          defaultsTo: 'studio'
        },
        dbConnection: {
            type: 'ref',
            description: 'A db connection to use for the refund. Enables use inside transactions.',
            required: false
        },

    },


    exits: {

        originalClassPassGone: {
            description: 'The class pass used to create the signup is not in the database anymore. This is a serious error, since class passes should never really be deleted, just archived.'
        }

    },


    fn: async (inputs, exits) => {

        const dbConWrap = sails.helpers.util.dbConnectionWrapperFactory(inputs.dbConnection);

        const signupModel = inputs.signupType === 'livestream' ? ClassLivestreamSignup : ClassSignup

        const signup = await signupModel.findOne(
            sails.helpers.util.idOrObjectIdInteger(inputs.signup)
        );

        if (!signup.used_class_pass) {
            return exits.success({classPassWasRefunded: false});
        }

        let classPass = await ClassPass.findOne(signup.used_class_pass).populate('class_pass_type');

        if (!classPass) throw 'originalClassPassGone';

        if (classPass.archived) {
            // Don't refund an archived class pass
            return exits.success({
                classPassWasRefunded: false,
                reasonForNotRefunding: 'classPassIsArchived',
                localizedReasonForNotRefunding: sails.helpers.t('classPass.classPassIsArchived'),
            });
        }

        if (moment(classPass.valid_until, 'YYYY-MM-DD').isBefore(moment(), 'day')) {
            // Don't refund an expired class pass
            return exits.success({
                classPassWasRefunded: false,
                reasonForNotRefunding: 'classPassHasExpired',
                localizedReasonForNotRefunding: sails.helpers.t('classPass.classPassHasExpired'),
            });
        }

        if (classPass.class_pass_type.pass_type !== 'fixed_count') {
            // Unlimited classpasses do not need refunding
            return exits.success({
                classPassWasRefunded: false,
                reasonForNotRefunding: 'classPassIsUnlimited',
                localizedReasonForNotRefunding: sails.helpers.t('classPass.classPassIsUnlimited')
            });
        }


        // The original class pass is still active

        await dbConWrap(ClassPass.update({
                id: classPass.id
            }, {
                classes_left: parseInt(classPass.classes_left) + 1
            }
        ));

        await dbConWrap(
          signupModel.update({
            id: signup.id
          }, {
            class_pass_seat_spent: false
          })
        )

        return exits.success({
            classPassWasRefunded: true,
            previousNumberOfClasses: classPass.classes_left,
        });
    }

};
