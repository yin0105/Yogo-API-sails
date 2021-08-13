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
    console.log("policyFilePath = ", policyFilePath);
    try {
      acl = require('../acl/' + policyFilePath);
    } catch (e) {
      console.log("No policyfile");
      throw 'noPolicyFile'; 
    }

    const aclPublicPermission = acl.public;
    console.log("1");
    if (aclPublicPermission === true) return exits.success(true);
    console.log("2");
    if (typeof aclPublicPermission === 'function' && (await aclPublicPermission(inputs.req, inputs.controllerActionInputs))) return exits.success(true);
    console.log("3: ", inputs.req.authorizedRequestContext);
    if (inputs.req.authorizedRequestContext === 'public') return exits.success(false);
    console.log("4");
    const aclAuthorizedPermission = acl[inputs.req.authorizedRequestContext];
    console.log("5");
    if (typeof aclAuthorizedPermission === 'undefined') return exits.success(false);
    console.log("6");
    if (typeof aclAuthorizedPermission === 'boolean') return exits.success(aclAuthorizedPermission);
    console.log("7");
    if (typeof aclAuthorizedPermission === 'function') {
      console.log("8");
      const response = await aclAuthorizedPermission(inputs.req, inputs.controllerActionInputs);
      return exits.success(response);
    }

    throw 'invalidPolicyFile';

  },

};
