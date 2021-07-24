module.exports = async function (req, res) {

  let clientData = _.pick(req.body, [
    'name',
    'address_1',
    'address_2',
    'zip_code',
    'city',
    'country',
    'vat_number',
    'email',
    'phone',
    'website',
    'sms_sender_name',
    'logo',
    'logo_white'
  ])

  let client = await Client.update({id: req.param('id')}, clientData).fetch()
  let response = await sails.helpers.clientSettings.update(req.param('id'), {"sms_sender_name": req.param("sms_sender_name")})
  let clientSetting = await ClientSettings.update({client: req.param('id')}, {sms_sender_name: req.param('sms_sender_name')}).fetch()

  client = client[0]

  return res.json(client)

}



// module.exports = {
//   friendlyName: 'Update discount code',
  
//   inputs: {
//     name: {
//       type: 'string',
//       required: false,
//     },

//     address_1: {
//       type: 'string',
//       required: false,
//     },

//     address_2: {
//       type: 'string',
//       required: false,
//     },

//     zip_code: {
//       type: 'string',
//       required: false,
//     },

//     city: {
//       type: 'string',
//       required: false,
//     },

//     country: {
//       type: 'string',
//       required: false,
//     },

//     vat_number: {
//       type: 'string',
//       required: false,
//     },

//     email: {
//       type: 'string',
//       required: false,
//     },

//     phone: {
//       type: 'string',
//       required: false,
//     },

//     website: {
//       type: 'string',
//       required: false,
//     },

//     sms_sender_name: {
//       type: 'string',
//       required: false,
//     },

//     // logo: {
//     //   type: 'string',
//     //   required: false,
//     // },

//     // logo_white: {
//     //   type: 'number',
//     //   required: false,
//     // },
//   },

//   exits: {
//     forbidden: {
//       responseType: 'forbidden',
//     },
//   },

//   fn: async function (inputs, exits) {
//     console.log("== update:: ", inputs);
//     console.log("== req = ", this.req);
//     console.log("== req = ", this.req.param('id'));

//     // if (!(await sails.helpers.can2('controller.Client.update', this.req))) {
//     //   return exits.forbidden()
//     // }

//     // const existingDiscountCodesWithSameCode = await knex('clients')
//     //   .where({
//     //     client: this.req.client.id,
//     //     name: inputs.name,
//     //     archived: false,
//     //   })
//     //   .andWhere('id', '!=', this.req.param('id'))

//     // if (existingDiscountCodesWithSameCode.length) {
//     //   return exits.success('E_CODE_EXISTS')
//     // }

//     const updatedClient = await Client.update({id: this.req.param('id')}, inputs).fetch()
//     console.log("sms_sender_name = ", this.req.param("sms_sender_name"));
//     const response = await sails.helpers.clientSettings.update(this.req.param('id'), {"sms_sender_name": this.req.param("sms_sender_name")})
//       // .tolerate('invalidKeys', async (e) => {
//       //   exits.badRequest(e.message)
//       //   return e
//       // })
//       // .tolerate('invalidValue', async (e) => {
//       //   exits.badRequest(e.message)
//       //   return e
//       // })
//       // .tolerate('invalidEmail', async (e) => {
//       //   exits.badRequest(e.message)
//       //   return e
//       // })

//     return exits.success(updatedClient)
//     // return exits.success('OK');
//   },
// }


