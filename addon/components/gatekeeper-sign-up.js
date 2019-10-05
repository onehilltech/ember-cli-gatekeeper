import Component from '@ember/component';
import layout from '../templates/components/gatekeeper-sign-up';

import { computed, get } from '@ember/object';
import { not, or } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { isPresent } from '@ember/utils';

import { default as StandardSubmit } from "../-lib/standard-submit-strategy";

function noOp () { }

export default Component.extend ({
  layout,

  classNames: ['gatekeeper-sign-up'],
  classNameBindings: ['horizontal:gatekeeper--horizontal'],

  horizontal: false,

  store: service (),

  signUpOptions: null,

  valid: true,
  invalid: not ('valid'),

  style: 'outlined',
  submitButtonStyle: 'raised',

  useEmailForUsername: false,
  mustConfirmPassword: true,

  usernameLabel: 'Username',
  emailLabel: 'Email address',
  passwordLabel: 'Password',
  confirmPasswordLabel: 'Confirm password',

  invalidPassword: not ('validPassword'),

  /// Sign in the user when the account is created.
  autoSignIn: true,

  /// The account is enabled when created.
  accountEnabled: true,

  submitting: false,

  /// The submit strategy for the component.
  submit: null,

  submitButtonText: 'Create My Account',

  confirmed: computed ('{mustConfirmPassword,password,confirmPassword}', function () {
    const {
      mustConfirmPassword,
      password,
      confirmPassword
    } = this.getProperties (['mustConfirmPassword', 'password', 'confirmPassword']);

    return !mustConfirmPassword || password === confirmPassword;
  }),

  unconfirmed: not ('confirmed'),

  confirmErrorMessage: computed ('confirmPassword', function () {
    const { unconfirmed, confirmPassword } = this.getProperties (['unconfirmed', 'confirmPassword']);
    return isPresent (confirmPassword) && unconfirmed ? 'The passwords do not match.' : null;
  }),

  defaultConfirmErrorMessage: 'The passwords do not match.',

  disabled: or ('{submitting,invalid,unconfirmed,invalidPassword}', 'submit.disabled'),

  init () {
    this._super (...arguments);

    this.set ('submit', StandardSubmit.create ({component: this}));
  },

  /**
   * The account was successfully created.
   *
   * @param account
   */
  didCreateAccount (/*account*/) {
  },

  /**
   * There was an error while creating the account.
   *
   * @param xhr
   */
  didError (xhr) {
    let error = get (xhr, 'errors.0');

    if (isPresent (error)) {
      switch (error.code) {
        case 'username_exists':
          if (this.get ('useEmailForUsername')) {
            this.set ('emailErrorMessage', error.detail);
          }
          else {
            this.set ('usernameErrorMessage', error.detail);
          }
          break;

        case 'email_exists':
          this.set ('emailErrorMessage', error.detail);
          break;

        case 'invalid_password':
          this.set ('passwordErrorMessage', error.detail);
          break;

        default:
          this.set ('messageToUser', error.detail);
      }
    }

    this.getWithDefault ('error', noOp) (xhr);
  },

  /**
   * Perform the submission of the information to create an account.
   */
  signUp (options = {}) {
    let {
      username,
      password,
      email,
      autoSignIn,
      signUpOptions,
      useEmailForUsername,
      accountEnabled
    } = this.getProperties (['username','password','email','recaptcha', 'autoSignIn', 'useEmailForUsername', 'accountEnabled', 'signUpOptions']);

    if (useEmailForUsername) {
      username = email;
    }

    this.set ('submitting', true);

    let account = this.get ('store').createRecord ('account', {username, password, email, enabled: accountEnabled});
    let adapterOptions = Object.assign ({}, signUpOptions, {signIn: autoSignIn}, options);

    account.save ({adapterOptions}).then (account => {
      this.set ('submitting', false);

      return Promise.resolve (this.didCreateAccount (account))
        .then (() => this.getWithDefault ('complete', noOp) (account));
    }).catch (xhr => {
      this.set ('submitting', false);
      return this.didError (xhr);
    });
  },

  actions: {
    submit (ev) {
      // Prevent the default event from occurring.
      ev.preventDefault ();

      // Reset the current error message.
      this.set ('errorMessage');
      this.get ('submit').signUp ();

      return false;
    },

    toggle () {
      this.toggleProperty ('showPassword');
    }
  },
});
