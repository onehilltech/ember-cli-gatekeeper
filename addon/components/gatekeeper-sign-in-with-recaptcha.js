import SignInComponent from './gatekeeper-sign-in';
import layout from '../templates/components/gatekeeper-sign-in-with-recaptcha';

import { computed } from '@ember/object';
import { bool, not, equal, readOnly } from '@ember/object/computed';
import { isEmpty } from '@ember/utils';

import { default as SignIn } from '../-lib/sign-in-strategy';

/**
 * The sign in process that requires recaptcha.
 */
const RecaptchaSignIn = SignIn.extend ({
  component: null,

  verified () {

  },

  handleError () {
    this.component.set ('reset', true);
  }
});

/**
 * @class V2RecaptchaSignIn
 *
 * Sign in strategy for recaptcha v2.
 */
const V2RecaptchaSignIn = RecaptchaSignIn.extend ({
  componentName: 'g-recaptcha-v2',

  /// The v2 is disabled as long as there is no response (i.e., unverified).
  disabled: readOnly ('component.unverified'),

  signIn () {
    const response = this.component.get ('response');
    this.component.doSignIn ({recaptcha: response});
  },

  verified (response) {

  }
});

/**
 * @class InvisibleRecaptchaSignIn
 *
 * Sign in strategy for recaptcha invisible.
 */
const InvisibleRecaptchaSignIn = RecaptchaSignIn.extend ({
  componentName: 'g-recaptcha-invisible',
  disabled: false,

  signIn () {
    const response = this.component.get ('response');

    if (isEmpty (response)) {
      // We do not have a response. Let's execute the recaptcha for the first time.
      this.component.set ('execute', true);
    }
    else {
      // We have a response, so we can just complete the sign in.
      this.component.doSignIn ({ recaptcha: response });
    }
  },

  verified (response) {
    this.component.doSignIn ({ recaptcha: response });
  }
});

export default SignInComponent.extend({
  layout,

  classNameBindings: ['recaptchaClassName'],

  recaptchaClassName: computed ('recaptcha', function () {
    return `gatekeeper-sign-in--recaptcha-${this.get ('recaptcha')}`;
  }),

  recaptcha: 'invisible',
  v2: equal ('recaptcha', 'v2'),
  invisible: equal ('recaptcha', 'invisible'),

  reset: false,



  execute: false,

  response: null,
  verified: bool ('response'),
  unverified: not ('verified'),

  _recaptcha: null,

  didReceiveAttrs () {
    this._super (...arguments);

    const recaptcha = this.get ('recaptcha');

    if (recaptcha !== this._recaptcha) {
      const Class = recaptcha === 'v2' ? V2RecaptchaSignIn : InvisibleRecaptchaSignIn;
      this.set ('signIn', Class.create ({component: this}));

      this._recaptcha = recaptcha;
    }
  },

  componentName: readOnly ('signIn.componentName'),

  actions: {
    verified (response) {
      this.set ('response', response);
      this.get ('signIn').verified (response);
    },

    expired () {
      this.get ('signIn').expired ();
    }
  }
});
