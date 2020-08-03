import Mixin from '@ember/object/mixin';

import { computed } from '@ember/object';
import { bool, not, readOnly, or } from '@ember/object/computed';
import { isPresent } from '@ember/utils';

import { default as Submit } from '../-lib/submit-strategy';

/**
 * The sign in process that requires recaptcha.
 */
const RecaptchaSignIn = Submit.extend ({
  component: null,

  handleError () {
    this.component.setProperties ({ reset: true, response: null });
  },

  verified () {

  }
});

/**
 * @class V2RecaptchaSignIn
 *
 * Sign in strategy for recaptcha v2.
 */
const V2RecaptchaSignIn = RecaptchaSignIn.extend ({
  /// The v2 is disabled as long as there is no response (i.e., unverified).
  disabled: readOnly ('component.unverified'),

  signIn (verifiedCallback) {
    return verifiedCallback ();
  }
});

/**
 * @class InvisibleRecaptchaSignIn
 *
 * Sign in strategy for recaptcha invisible.
 */
const InvisibleRecaptchaSignIn = RecaptchaSignIn.extend ({
  /// The component is never disabled.
  disabled: false,

  signIn (verifiedCallback) {
    const response = this.component.get ('response');

    if (isPresent (response)) {
      // We have a response, so we can just complete the sign in.
      return verifiedCallback ();
    }

    // We do not have a response. Let's execute the recaptcha for the first time.
    this.component.set ('execute', true);
  },

  verified (verifiedCallback) {
    return verifiedCallback ();
  }
});

export default Mixin.create ({
  classNameBindings: ['recaptchaClassName'],

  recaptchaClassName: computed ('recaptcha', function () {
    const recaptcha = this.recaptcha;
    return `gatekeeper--recaptcha-${recaptcha}`;
  }),

  recaptcha: 'invisible',

  recaptchaImpl: computed ('recaptcha', function () {
    const Class = this.recaptcha === 'invisible' ? InvisibleRecaptchaSignIn : V2RecaptchaSignIn;
    return Class.create ({component: this});
  }),

  recaptchaComponentName: computed ('recaptcha', function () {
    return `g-recaptcha-${this.recaptcha}`;
  }),

  /// Reset the recaptcha.
  reset: false,

  /// Execute the recaptcha.
  execute: false,

  /// The current recaptcha response.
  response: null,

  /// The user has been verified.
  verified: bool ('response'),

  /// The user is not verified.
  unverified: not ('verified'),

  /// Disabled state for the sign in button.
  signInDisabled: or ('disabled', 'recaptchaImpl.disabled'),

  handleError () {
    this._super (...arguments);

    // Let the implementation handle the error.
    this.recaptchaImpl.handleError ()
  },

  /**
   * Sign in the user.
   *
   * @param options
   * @returns {void|*}
   */
  signIn (options) {
    return this.recaptchaImpl.signIn (this._verified.bind (this, options));
  },

  /**
   * Implementation of what happens after sign in.
   *
   * @param options
   * @private
   */
  _verified (options) {
    let response = this.response;
    let opts = Object.assign ({recaptcha: response}, options);

    // Pass control to the base class.
    this._executeSignIn (opts);
  },

  actions: {
    verified (response) {
      // Cache the response.
      this.set ('response', response);

      // Let the implementation know we are verified.
      return this.recaptchaImpl.verified (this._verified.bind (this));
    }
  }
});
