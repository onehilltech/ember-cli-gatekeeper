import Component from '@ember/component';

import layout from '../templates/components/gatekeeper-sign-in';

import { inject } from '@ember/service';
import { get, getWithDefault, computed } from '@ember/object';
import { not, or } from '@ember/object/computed';
import { isPresent, isNone } from '@ember/utils';
import { getOwner } from '@ember/application';
import { inject as service } from '@ember/service';

function identity (value) {
  return () => value;
}

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

  router: service (),

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
        // Notify the subclass that the user did sign in to the application.
        this.didSignIn ();

        if (this.getWithDefault ('signInComplete', identity (true)) ()) {
          this._redirectTo ();
        }
      })
      .catch (this.handleError.bind (this))
      .then (() => this.set ('submitting', false));
  },

  signUp () {
    return this.getWithDefault ('signUpClick', identity (true)) ();
  },

  willSignIn () {

  },

  didSignIn () {

  },

  handleError (xhr) {
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
      this.setProperties ('errorMessage', xhr.statusText || xhr.message);
    }
  },

  /**
   * Perform the redirect to for the user. This will either take the user to the original
   * page they accessed before being redirected to the sign-in page, or the start route
   * if no redirect is present.
   *
   * @private
   */
  _redirectTo () {
    // Perform the redirect from the sign in page.
    let redirectTo = this.get ('redirect');

    if (isNone (redirectTo)) {
      // There is no redirect url. So, we either transition to the default route, or we
      // transition to the index.
      let ENV = getOwner (this).resolveRegistration ('config:environment');
      redirectTo = getWithDefault (ENV, 'gatekeeper.startRoute', 'index');
    }

    this.router.replaceWith (redirectTo);
  },

  redirect: computed ('router.currentURL', function () {
    let currentURL = this.get ('router.currentURL');
    let [ , query ] = currentURL.split ('?');

    if (isNone (query)) {
      return null;
    }

    let params = query.split ('&');
    return params.reduce ((accum, param) => {
      let [name, value] = param.split ('=');
      return name === 'redirect' ? decodeURIComponent (value) : accum;
    }, null);
  }),

  actions: {
    signInForm (ev) {
      // Prevent the default behavior of the button.
      ev.preventDefault ();

      const { target : form } = ev;

      if (form.checkValidity ()) {
        this.signIn ();
      }
    },

    signInButton (ev) {
      // Prevent the default behavior of the button.
      ev.preventDefault ();

      const { target: { form } } = ev;

      if (form.checkValidity()) {
        this.signIn ();
      }
    },

    signUp () {
      this.signUp ();
    }
  }
});
