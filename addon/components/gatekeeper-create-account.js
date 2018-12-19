import { isPresent, isEmpty } from '@ember/utils';
import { computed, get } from '@ember/object';
import { equal } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import Evented, { on } from '@ember/object/evented';
import Component from '@ember/component';
import ReCaptcha from '../-lib/mixins/recaptcha';
import layout from '../templates/components/gatekeeper-create-account';

export default Component.extend (ReCaptcha, Evented, {
  layout,

  classNames: ['gk-form--create-account'],
  mergedProperties: ['submitButtonStateText'],

  store: service (),

  confirmPassword: true,

  submitButtonColor: 'primary',

  usernameLabel: 'Username',
  usernamePlaceholder: null,

  emailLabel: 'Email address',
  emailPlaceholder: null,

  passwordLabel: 'Password',
  passwordPlaceholder: null,

  confirmPasswordLabel: 'Confirm password',
  confirmPasswordPlaceholder: null,

  /// Control if the newly created account is enabled.
  accountEnabled: true,

  state: 'waiting',
  isVerifying: equal ('state', 'waiting'),
  isSubmitting: equal ('state', 'submitting'),

  submitButtonStateText: {
    waiting: 'Sign Up',
    verifying: 'Verifying...',
    submitting: 'Signing Up...'
  },

  submitButtonText: computed ('state', function () {
    let state = this.get ('state');
    return this.get (`submitButtonStateText.${state}`);
  }),

  confirmErrorMessage: computed ('confirmedPassword', function () {
    let {confirmedPassword,passwordMatches} = this.getProperties (['confirmedPassword','passwordMatches']);
    return isPresent (confirmedPassword) && !passwordMatches  ? 'The password does not match' : null;
  }),

  passwordMatches: computed ('{password,confirmedPassword}', function () {
    let {password,confirmPassword,confirmedPassword} = this.getProperties (['password','confirmPassword','confirmedPassword']);
    return !confirmPassword || (!isEmpty (password) && password === confirmedPassword);
  }),

  disabled: computed ('{state,useEmailForUsername,username,email,password,confirmPassword,confirmedPassword}', function () {
    let {
      state,
      useEmailForUsername,
      username,
      email,
      password,
      passwordMatches
    } = this.getProperties (['state', 'useEmailForUsername','username','email','password','passwordMatches']);

    if (state !== 'waiting') {
      return true;
    }

    if (useEmailForUsername) {
      username = email;
    }

    return isEmpty (username) ||
      isEmpty (email) ||
      isEmpty (password) ||
      !passwordMatches;
  }),

  didCreateAccount: on ('didCreateAccount', function (account) {
    this.sendAction ('accountCreated', account);
  }),

  handleError: on ('error', function (xhr) {
    this.set ('state', 'waiting');
    let error = get (xhr, 'errors.0');

    if (isPresent (error)) {
      switch (error.code) {
        case 'already_exists':
          this.set ('emailErrorMessage', 'This email address already has an account.');
          break;

        default:
          this.set ('messageToUser', error.detail);
      }
    }

    this.sendAction ('error', xhr);
  }),

  actions: {
    createAccount () {
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

  /**
   * Submit the account data to the server for account creation.
   *
   * @private
   */
  _doSubmit () {
    let {
      username,
      password,
      email,
      recaptcha,
      autoSignIn,
      useEmailForUsername,
      accountEnabled
    } = this.getProperties (['username','password','email','recaptcha', 'autoSignIn', 'useEmailForUsername', 'accountEnabled']);

    let adapterOptions = {};

    if (autoSignIn) {
      adapterOptions.signIn = true;
    }

    if (isPresent (recaptcha)) {
      adapterOptions.recaptcha = recaptcha.get ('value');
    }

    if (useEmailForUsername) {
      username = email;
    }

    let account = this.get ('store').createRecord ('account', {username, password, email, enabled: accountEnabled});

    this.set ('state', 'submitting');
    this.trigger ('willCreateAccount');

    account.save ({adapterOptions}).then ((account) => {
      if (!this.get ('isDestroyed')) {
        this.setProperties ({
          state: 'waiting',
          username: null,
          email: null,
          password: null,
          confirmedPassword: null,
        });
      }

      if (isPresent (recaptcha)) {
        recaptcha.set ('value');
      }

      this.trigger ('didCreateAccount', account);
    }).catch (xhr => {
      this.trigger ('error', xhr);
    });
  }
});
