module.exports = {

  friendlyName: 'Fill in variables',

  description: 'Replaces shortcode-style variables in brackets with the corresponding value.',

  exits: {
    classSourceObjectRequiresLocale: {
      description: 'Class source object requires a locale for formatting class date',
    },
  },

  inputs: {
    text: {
      type: 'ref',
      description: 'The text that should have variables filled in. Can be an array of texts.',
      required: true,
    },
    values: {
      type: 'ref',
      description: 'The values to replace the variables with. Can be empty if source objects are provided.',
      required: true,
    },
    objects: {
      type: 'ref',
      description: 'Data objects or object ids. Available data types: studio (client), customer (user), class.',
      required: false,
    },
    locale: {
      type: 'string',
      description: 'Used for date formatting. Required if objects.class is specified.',
      required: false,
    },
  },

  fn: async (inputs, exits) => {
    const values = {};

    if (inputs.objects) {
      const invalidObjectKeys = _.keys(_.omit(inputs.objects, ['studio', 'customer','class']))
      if (invalidObjectKeys.length) {
        throw new Error('Invalid object(s) specified: ' + invalidObjectKeys.join(', '))
      }
      if (inputs.objects.studio) {
        let studio;
        if (_.isInteger(inputs.objects.studio)) {
          studio = await Client.findOne(inputs.objects.studio);
        } else {
          studio = inputs.objects.studio;
        }
        _.each(
          ['name', 'address_1', 'address_2', 'zip_code', 'city', 'phone', 'email', 'website'],
          (field) => {
            values['studio_' + field] = studio[field];
          },
        );
      }

      if (inputs.objects.customer) {
        let customer;
        if (_.isInteger(inputs.objects.customer)) {
          customer = await User.findOne(inputs.objects.customer);
        } else {
          customer = inputs.objects.customer;
        }
        _.each(
          ['first_name', 'last_name', 'address_1', 'address_2', 'zip_code', 'city', 'phone', 'email'],
          (field) => {
            values[field] = customer[field];
            values['customer_' + field] = customer[field];
          },
        );
        values.customer_full_name = _.compact([customer.first_name, customer.last_name]).join(' ');
        values.customer_name = values.customer_full_name;
        values.full_name = values.customer_full_name;
        values.name = values.customer_full_name;
        values.customer_profile_link = await sails.helpers.webapps.getLink(customer.client, '/my-profile');
        values.profile_link = values.customer_profile_link;
        values.customer_purchase_history = values.customer_profile_link.replace(/my-profile/, 'purchase-history');
        values.purchase_history = values.customer_purchase_history;
        values.customer_purchase_history_link = values.customer_purchase_history;
        values.purchase_history_link = values.customer_purchase_history;
      }

      if (inputs.objects.class) {
        if (!inputs.locale) {
          throw 'classSourceObjectRequiresLocale';
        }
        let classObj;
        if (_.isInteger(inputs.objects.class)) {
          classObj = await Class.findOne(inputs.objects.class).populate('class_type');
        } else {
          classObj = inputs.objects.class;
          if (!_.isObject(classObj.class_type)) {
            classObj.class_type = await ClassType.findOne(classObj.class_type_id || classObj.class_type);
          }
        }
        values.class_date = sails.helpers.util.formatDate(classObj.date, inputs.locale);
        values.class_start_time = classObj.start_time.substr(0, 5);
        values.class_time = values.class_start_time;
        values.class_end_time = classObj.end_time.substr(0, 5);
        values.class_type_name = classObj.class_type.name;
        values.class_name = classObj.class_type.name;
        values.class_type = classObj.class_type.name;
        values.livestream_link = await sails.helpers.webapps.getLink(classObj.client_id || classObj.client, `/livestream/class/${classObj.id}/preloader`);
      }
    }

    _.assign(values, inputs.values);

    let texts;
    if (_.isArray(inputs.text)) {
      texts = inputs.text;
    } else {
      texts = [inputs.text];
    }
    for (let i = 0; i < texts.length; i++) {
      _.each(values, (value, key) => {
        texts[i] = texts[i].replace(new RegExp('\\[' + key + '\\]', 'g'), value);
      });
    }

    return exits.success(_.isArray(inputs.text) ? texts : texts[0]);
  },

};
