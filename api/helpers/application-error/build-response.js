const legacyErrorStrings = {
  classHasStarted: 'E_CLASS_HAS_STARTED',
  signupDeadlineHasBeenExceeded: 'E_SIGNUP_DEADLINE_HAS_BEEN_EXCEEDED',
  loginFailed: 'E_LOGIN_FAILED',
  userIsNotTeacher: 'E_USER_IS_NOT_TEACHER',
  emailNotFound: 'E_EMAIL_NOT_FOUND',
  passwordTooWeak: 'E_PASSWORD_TOO_WEAK',
  invalidToken: 'E_INVALID_TOKEN',
  tokenExpired: 'E_TOKEN_EXPIRED',
  alreadySignedUp: 'E_ALREADY_SIGNED_UP',
  classCancelled: 'E_CLASS_CANCELLED',
  classIsFull: 'E_CLASS_IS_FULL',
  customerHasNoValidClassPassOrMembership: 'E_CUSTOMER_HAS_NO_VALID_CLASS_PASS_OR_MEMBERSHIP',
  noAccess: 'E_CUSTOMER_HAS_NO_VALID_CLASS_PASS_OR_MEMBERSHIP',
  waitingListDisabled: 'E_CLASS_WAITING_LIST_DISABLED',
  privateClassWaitingListDisabled: 'E_PRIVATE_CLASS_WAITING_LIST_DISABLED',
  classIsOpen: 'E_CLASS_IS_OPEN',
  signoffDeadlineHasBeenExceeded: 'E_SIGNOFF_DEADLINE_HAS_BEEN_EXCEEDED',
  alreadySignedUpForWaitingList: 'E_ALREADY_SIGNED_UP_FOR_WAITING_LIST',
  waitingListIsFull: 'E_WAITING_LIST_IS_FULL',
  classIsNotFull: 'E_CLASS_IS_NOT_FULL',
  noShowFeeAlreadyPaid: 'E_NO_SHOW_FEE_ALREADY_PAID',
  classNotFound: 'E_CLASS_NOT_FOUND,',
  classIsNotToday: 'E_CLASS_IS_NOT_TODAY',
};

module.exports = {
  friendlyName: 'Build error response',

  description: 'Checks if the client accepts extended error responses or not, and generates the appropriate response.',

  inputs: {
    errorCode: {
      type: 'string',
      required: true,
    },
    req: {
      type: 'ref',
      required: true,
    },
    params: {
      type: 'json',
      defaultsTo: {},
    },
  },

  fn: async (inputs, exits) => {
    if (!inputs.req.clientAcceptsExtendedErrorFormat) {
      const legacyErrorString = legacyErrorStrings[inputs.errorCode];
      if (legacyErrorString) {
        return exits.success(legacyErrorString);
      }
      return exits.success(inputs.errorCode);
    }

    //const locale = await sails.helpers.clientSettings.find(inputs.req.client, 'locale');
    const errorResponse = {
      error: {
        type: inputs.errorCode,
        localized_title: sails.helpers.t(`error.${inputs.errorCode}_title`, inputs.params),
        localized_message: sails.helpers.t(`error.${inputs.errorCode}_message`, inputs.params),
      },
    };
    return exits.success(errorResponse);
  },
};
