import Component from '@ember/component';
import layout from '../templates/components/gatekeeper-sign-in';

import ReCaptcha from '../-lib/mixins/recaptcha';

import Evented from '@ember/object/evented';

import { inject } from '@ember/service';
import { computed } from '@ember/object'
import { equal } from '@ember/object/computed';

import { isEmpty, isPresent } from '@ember/utils';

import { get } from '@ember/object'
import { merge } from '@ember/polyfills';

function noOp () {

}

export default Component.extend (ReCaptcha, Evented, {
  layout,

  classNames: ['gatekeeper-sign-in'],

  /// The default style for the text field.
  style: 'box',

  /// The valid state for the sign in component.
  valid: true,

  //== username properties

  username: null,
  usernameType: 'text',
  usernameLabel: 'Username',
  usernameIcon: null,
  usernameIconPosition: null,
  usernameAutoComplete: 'off',

  //== password properties

  showPassword: false,
  enableShowPassword: false,

  passwordLabel: 'Password',

  passwordIcon: computed ('{enableShowPassword,showPassword}', function () {
    const {enableShowPassword,showPassword} = this.getProperties (['enableShowPassword','showPassword']);
    return enableShowPassword ? (showPassword ? 'visibility' : 'visibility_off') : null;
  }),

  passwordType: computed ('showPassword', function () {
    return this.get ('showPassword') ? 'text' : 'password';
  }),

  //== button

  signInButtonColor: 'primary',

  mergedProperties: ['signInOptions','submitButtonStateText'],

  session: inject (),

  signInOptions: null,
  submitButtonStateText: null,

  submitButtonText: computed ('state', function () {
    let state = this.get ('state');
    return this.get (`submitButtonStateText.${state}`);
  }),

  state: 'signedOut',
  isSignedOut: equal ('state', 'signedOut'),
  isSigningIn: equal ('state', 'signingIn'),

  disabled: computed ('isSigningIn', 'valid', 'recaptcha.value', function () {
    let {valid, isSigningIn} = this.getProperties (['valid', 'isSigningIn']);
    return !valid || isSigningIn || (get (this, 'recaptcha.type') === 'v2' && isEmpty (get (this, 'recaptcha.value')));
  }),

  init () {
    this._super (...arguments);

    this.set ('signInOptions', {});
    
    this.set ('submitButtonStateText', {
      signedOut: 'Sign In',
      signingIn: 'Signing In...',
      verifying: 'Verifying...'
    })
  },

  willSignIn () {
    this.set ('state', 'signingIn');
  },

  didSignIn () {
    this.set ('state', 'signedIn');
    this.getWithDefault ('complete', noOp) ();
  },

  handleError (xhr) {
    this.set ('state', 'signedOut');

    let error = get (xhr, 'responseJSON.errors.0');

    if (isPresent (error)) {
      switch (error.code) {
        case 'invalid_username':
          this.set ('usernameErrorMessage', error.detail);
          break;

        case 'invalid_password':
          this.set ('passwordErrorMessage', error.detail);
          break;

        default:
          this.set ('errorMessage', error.detail);
      }
    }
    else {
      this.setProperties ('errorMessage', xhr.statusText);
    }
  },

  actions: {
    toggleShowPassword () {
      this.toggleProperty ('showPassword');
    },

    signIn () {
      // Reset the current error message.
      this.set ('errorMessage');

      let recaptcha = this.get ('recaptcha');

      if (isPresent (recaptcha) && isEmpty (recaptcha.get ('value'))) {
        recaptcha.set ('reset', true);
      }
      else {
        this._doSubmit ();
      }
    }
  },

  _doSubmit () {
    // Login the user.
    let {username, password, signInOptions, recaptcha} = this.getProperties (['username', 'password', 'signInOptions', 'recaptcha']);
    let opts = merge ({username, password}, signInOptions);

    if (isPresent (recaptcha)) {
      opts.recaptcha = recaptcha.get ('value');
    }

    this.willSignIn ();

    this.get ('session').signIn (opts).then (() => {
      this.didSignIn ();
    }).catch (xhr => {
      this.handleError (xhr);
    });
  }
});
