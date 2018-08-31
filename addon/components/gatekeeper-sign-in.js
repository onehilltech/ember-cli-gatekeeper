import Component from '@ember/component';

import layout from '../templates/components/gatekeeper-sign-in';

import { inject } from '@ember/service';
import { computed } from '@ember/object'
import { not, or, readOnly, alias } from '@ember/object/computed';

import { isEmpty, isPresent, isNone } from '@ember/utils';

import { get } from '@ember/object'
import { merge } from '@ember/polyfills';

import { default as Submit } from '../-lib/submit-strategy';

function noOp () {}

/**
 * The standard sign in process.
 */
const StandardSubmit = Submit.extend ({
  /// The standard sign is never has any additional reasons for
  /// being marked as disabled.
  disabled: false,

  /**
   * Initiate the sign in process.
   */
  submit () {
    this.get ('component').doSubmit ();
  }
});

/**
 * @class SignInComponent
 */
export default Component.extend ({
  layout,

  classNames: ['gatekeeper-sign-in'],
  classNameBindings: ['horizontal:gatekeeper-sign-in--horizontal'],

  horizontal: false,

  /// The default style for the text field.
  style: 'box',

  /// The valid state for the sign in component.
  valid: true,
  invalid: not ('valid'),

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
  submitButtonText: 'Sign In',

  submitting: false,

  /// The disabled state for the button. The button is disabled if we are signing
  /// in, the form has invalid inputs, or the recaptcha is unverified.
  disabled: or ('submitting', 'invalid', 'submit.disabled'),

  /// The submit strategy for the component.
  submit: null,

  init () {
    this._super (...arguments);

    this.set ('submit', StandardSubmit.create ({component: this}));
  },

  /**
   * Do the sign in process.
   *
   * @param options
   */
  doSubmit (options = {}) {
    let {username, password, signInOptions} = this.getProperties (['username', 'password', 'signInOptions']);
    let opts = Object.assign ({}, signInOptions, options, {username, password});

    this.willSignIn ();
    this.set ('submitting', true);

    this.get ('session').signIn (opts)
      .then (() => {
        this.didSignIn ();
        this.getWithDefault ('complete', noOp) ();
      })
      .catch (this.handleError.bind (this))
      .then (() => {
        this.set ('submitting', false);
      });
  },

  willSignIn () {

  },

  didSignIn () {

  },

  handleError (xhr) {
    /// Handle an error.
    this.get ('submit').handleError ();

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

    signIn (ev) {
      // Prevent the default event from occurring.
      ev.preventDefault ();

      // Reset the current error message.
      this.set ('errorMessage');
      this.get ('submit').submit ();

      return false;
    }
  }
});
