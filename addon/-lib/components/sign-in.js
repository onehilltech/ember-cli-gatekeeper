import { merge } from '@ember/polyfills';
import { isEmpty, isPresent } from '@ember/utils';
import { equal } from '@ember/object/computed';
import { computed, get } from '@ember/object';
import { inject as service } from '@ember/service';
import Evented, { on } from '@ember/object/evented';
import Component from '@ember/component';
import ReCaptcha from "../mixins/recaptcha";

export default Component.extend (Evented, ReCaptcha, {
  //== username properties

  usernameLabelText: 'Username',
  usernameType: 'text',
  usernamePlaceholder: 'Username',
  usernameAutoComplete: 'off',
  usernameFloatingLabel: true,

  //== password properties

  passwordLabelText: 'Password',
  passwordPlaceholder: 'Password',
  passwordFloatingLabel: true,
  enableShowPassword: true,

  //== button

  signInButtonColor: 'primary',

  mergedProperties: ['signInOptions','submitButtonStateText'],

  session: service (),

  signInOptions: {},

  submitButtonStateText: {
    signedOut: 'Sign In',
    signingIn: 'Signing In...',
    verifying: 'Verifying...'
  },

  submitButtonText: computed ('state', function () {
    let state = this.get ('state');
    return this.get (`submitButtonStateText.${state}`);
  }),

  state: 'signedOut',
  isSignedOut: equal ('state', 'signedOut'),
  isSigningIn: equal ('state', 'signingIn'),

  disabled: computed ('{state,username,password}', 'recaptcha.value', function () {
    let {username, password,state} = this.getProperties (['username', 'password', 'state']);

    return isEmpty (username) ||
      isEmpty (password) ||
      (get (this, 'recaptcha.type') === 'v2' && isEmpty (get (this, 'recaptcha.value'))) ||
      state !== 'signedOut';
  }),

  willSignIn () {
    this.set ('state', 'signingIn');
  },

  didSignIn () {
    this.set ('state', 'signedIn');
    this.sendAction ('signInComplete');
  },

  handleError: on ('error', function (xhr) {
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
  }),

  actions: {
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
      this.trigger ('error', xhr);
    });
  }
});
