import Mixin from '@ember/object/mixin';

import { computed } from '@ember/object';
import { readOnly, equal, bool, not } from '@ember/object/computed';
import { isEmpty } from '@ember/utils';

import { default as Submit } from '../submit-strategy';

/**
 * The sign in process that requires recaptcha.
 */
const RecaptchaSignIn = Submit.extend ({
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
  disabled: not ('component.response'),

  submit () {
    const response = this.component.get ('response');
    this.component.doSubmit ({recaptcha: response});
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

  submit () {
    const response = this.component.get ('response');

    if (isEmpty (response)) {
      // We do not have a response. Let's execute the recaptcha for the first time.
      this.component.set ('execute', true);
    }
    else {
      // We have a response, so we can just complete the sign in.
      this.component.doSubmit ({ recaptcha: response });
    }
  },

  verified (response) {
    this.component.doSubmit ({ recaptcha: response });
  }
});

export default Mixin.create ({
  classNameBindings: ['recaptchaClassName'],

  recaptchaClassName: computed ('{recaptcha}', function () {
    const { recaptcha, recaptchaClassBaseName } = this.getProperties (['recaptcha', 'recaptchaClassBaseName']);
    return `${recaptchaClassBaseName}--recaptcha-${recaptcha}`;
  }),

  recaptcha: 'invisible',

  reset: false,
  execute: false,

  response: null,
  verified: bool ('response'),
  unverified: not ('verified'),

  _recaptcha: null,

  componentName: readOnly ('submit.componentName'),

  didReceiveAttrs () {
    this._super (...arguments);

    const recaptcha = this.get ('recaptcha');

    if (recaptcha !== this._recaptcha) {
      const Class = recaptcha === 'v2' ? V2RecaptchaSignIn : InvisibleRecaptchaSignIn;
      this.set ('submit', Class.create ({component: this}));

      this._recaptcha = recaptcha;
    }
  },

  actions: {
    verified (response) {
      this.set ('response', response);
      this.get ('submit').verified (response);
    },

    expired () {
      this.get ('submit').expired ();
    }
  }
});
