module.exports = {

    friendlyName: 'Populate class signups',

    description: 'Populates an array of class signups with the specified relations',

    inputs: {
        classSignups: {
            type :'ref',
            description: 'An array of class signups or a single class signup.',
            required: true
        },

        populateFields: {
            type: 'ref',
            description: 'An array of fields to populate. Sub fields are allowed and should be specified with dots. If not provided, the original array of signups are returned.',
            required: false
        }
    },

    exits: {
        success: {

        },

        populateFieldsInvalid: {
            description: 'The provided populate fields argument is not an array'
        },

        classSignupsInvalid: {
            description: 'The provided class signups argument is not an array'
        }

    },

    async fn (inputs, exits) {

        if (!inputs.populateFields) return exits.success(inputs.classSignups);
        if (!_.isArray(inputs.populateFields)) throw 'populateFieldsInvalid';

        const populateFields = _.keyBy(_.intersection(inputs.populateFields, [
            'class',
            'class.teachers',
            'class.teachers.image',
            'class.location',
            'class.room',
            'class.room.branch',
            'class.class_type',
            'class.class_type.image',
            'user',
            'user.image',
            'used_class_pass',
            'used_class_pass.class_pass_type',
            'used_membership'
        ]));


        const signups = _.isArray(inputs.classSignups) ? inputs.classSignups : [inputs.classSignups];

        if (populateFields['class']) {

            let classIds = _.uniq(_.map(signups, 'class'));

            let classQuery = Class.find({id: classIds, archived: false});

            if (populateFields['class.class_type']) classQuery.populate('class_type');
            if (populateFields['class.teachers']) classQuery.populate('teachers');
            if (populateFields['class.location']) classQuery.populate('location');
            if (populateFields['class.room']) classQuery.populate('room');


            let classes = await classQuery;

            classes = _.keyBy(classes, 'id');

            if (populateFields['class.room'] && populateFields['class.room.branch']) {
                  const branchIds = _.chain(classes)
                        .map('room.branch')
                        .uniq()
                        .compact()
                        .value()

              if (branchIds.length) {

                const branches = await Branch.find({id: branchIds})
                const branchesById = _.keyBy(branches, 'id')

                _.each(classes, (classItem) => {
                  if (classItem.room && classItem.room.branch) {
                    classItem.room.branch = branchesById[classItem.room.branch]
                  }
                })

              }
            }

            _.each(signups, (signup) => {
                signup.class = classes[signup.class]
            })
        }

        let imageIds = [];

        if (populateFields['class.teachers.image']) {

            _.each(signups, (signup) => {
                imageIds = imageIds.concat(_.map(signup.class.teachers, teacher => teacher.id))
            });
        }

        if (populateFields['class.class_type.image']) {
            imageIds = imageIds.concat(_.map(signups, signup => signup.class.class_type.image))
        }

        imageIds = _.uniq(_.compact(imageIds));

        let images = await Image.find({id: imageIds, archived: false});

        if (populateFields['class.teachers.image']) {
            _.each(signups, (signup) => {
                _.each(signup.class.teachers, (teacher) => {
                    if (teacher.image) teacher.image = images[teacher.image]
                })
            });
        }

        if (populateFields['class.class_type.image']) {
            _.each(signups, (signup) => {
                if (signup.class.class_type.image) signup.class.class_type.image = images[signup.class.class_type.image]
            })
        }


        if (populateFields['user']) {

            let userIds = _.map(signups, 'user')

            userIds = _.uniq(userIds)

            let userQuery = User.find({id: userIds, archived: false})

            if (populateFields['user.image']) userQuery.populate('image')

            let users = await userQuery

            users = _.keyBy(users, 'id');


            _.each(signups, (signup) => {
                signup.user = users[signup.user]
            })

        }

        if (populateFields.used_class_pass) {
            const classPassIds = _.uniq(_.compact(_.map(signups, signup => signup.used_class_pass)));

            const classPassRequest = ClassPass.find({id: classPassIds});

            if (populateFields['used_class_pass.class_pass_type']) {
                classPassRequest.populate('class_pass_type')
            }
            const classPasses = _.keyBy(await classPassRequest, 'id');

            _.each(signups, signup => signup.used_class_pass = classPasses[signup.used_class_pass]);
        }

        if (populateFields.used_membership) {
            const membershipIds = _.uniq(_.compact(_.map(signups, signup => signup.used_membership)));

            const membershipRequest = Membership.find({id: membershipIds});

            const memberships = _.keyBy(await membershipRequest, 'id');

            _.each(signups, signup => signup.used_membership = memberships[signup.used_membership]);
        }

        // Return array or single signup to match input.
        return exits.success(
            _.isArray(inputs.classSignups) ? signups : signups[0]
        );

    }
};
