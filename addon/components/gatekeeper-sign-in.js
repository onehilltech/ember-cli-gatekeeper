import Component from '@ember/component';

import layout from '../templates/components/gatekeeper-sign-in';

import { inject } from '@ember/service';
import { get } from '@ember/object';
import { not, or } from '@ember/object/computed';
import { isPresent } from '@ember/utils';

import { default as StandardSubmit } from '../-lib/standard-submit-strategy';

function noOp () {}

/**
 * @class SignInComponent
 */
export default Component.extend ({
  layout,

  classNames: ['gatekeeper-sign-in'],

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

  //== button

  signInButtonColor: 'primary',
  signInButtonText: 'Sign In',
  signInOptions: null,

  showSignUpButton: false,
  signUpButtonText: 'Sign Up',

  mergedProperties: ['signInOptions','submitButtonStateText'],

  session: inject (),

  submitting: false,

  invalidPassword: not ('validPassword'),

  /// The disabled state for the button. The button is disabled if we are signing
  /// in, the form has invalid inputs, or the recaptcha is unverified.
  disabled: or ('submitting', 'invalid', 'submit.disabled', 'invalidPassword'),
  
  /**
   * Do the sign in process.
   *
   * @param options
   */
  signIn (options = {}) {
    return this._executeSignIn (options);
  },

  _executeSignIn (options) {
    let {username, password, signInOptions} = this.getProperties (['username', 'password', 'signInOptions']);
    let opts = Object.assign ({}, signInOptions, options, {username, password});

    this.willSignIn ();
    this.set ('submitting', true);

    return this.get ('session').signIn (opts)
      .then (() => {
        this.didSignIn ();
        this.getWithDefault ('signInComplete', noOp) ();
      })
      .catch (this.handleError.bind (this))
      .then (() => this.set ('submitting', false));
  },

  signUp () {
    return this.getWithDefault ('signUpClick', noOp) ();
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
    submit (action, ev) {
      ev.preventDefault ();

      const { target: { form } } = ev;

      if (form.checkValidity ()) {
        if (action === 'signIn') {
          this.signIn ();
        }
        else if (action === 'signUp') {
          this.signUp ();
        }
      }

      return false;
    }
  }
});
