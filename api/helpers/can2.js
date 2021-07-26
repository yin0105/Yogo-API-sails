module.exports = {

  friendlyName: 'Can 2',

  description: 'Checks if user is allowed to perform the specified action. New version that should hopefully simplify the acl files.',

  inputs: {

    permission: {
      type: 'string',
      description: 'The required permission.',
      required: false,
    },

    req: {
      type: 'ref',
      description: 'The current request object.',
      required: true,
    },

    controllerActionInputs: {
      type: 'ref',
      description: "The 'inputs' object from the controller action. This should be used in acl files instead of req.query/req.body/req.param, to make sure that access is evaluated by the exact same inputs as are used in the controller action.",
      required: false
    }

  },

  exits: {
    noPolicyFile: {
      description: 'No policy file for the requested permission'
    },
    invalidPolicyFile: {
      description: 'The policy file is invalid'
    }
  },

  fn: async (inputs, exits) => {

    const policyFilePath = inputs.permission.replace(/\./g, '/');

    let acl;
    try {
      acl = require('../acl/' + policyFilePath);
    } catch (e) {
      throw 'noPolicyFile'; 
    }

    const aclPublicPermission = acl.public;
    console.log("aclPublicPermission= ", aclPublicPermission);

    if (aclPublicPermission === true) return exits.success(true);

    if (typeof aclPublicPermission === 'function' && (await aclPublicPermission(inputs.req, inputs.controllerActionInputs))) return exits.success(true);

    if (inputs.req.authorizedRequestContext === 'public') return exits.success(false);

    const aclAuthorizedPermission = acl[inputs.req.authorizedRequestContext];

    if (typeof aclAuthorizedPermission === 'undefined') return exits.success(false);

    if (typeof aclAuthorizedPermission === 'boolean') return exits.success(aclAuthorizedPermission);

    if (typeof aclAuthorizedPermission === 'function') {
      const response = await aclAuthorizedPermission(inputs.req, inputs.controllerActionInputs);
      return exits.success(response);
    }

    throw 'invalidPolicyFile';

  },

};
