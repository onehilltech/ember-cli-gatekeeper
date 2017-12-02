import ReCaptcha from '../-lib/mixins/recaptcha';
import layout from '../templates/components/gatekeeper-create-account';
import Ember from 'ember';

export default Ember.Component.extend (ReCaptcha, Ember.Evented, {
  layout,

  classNames: ['gk-form--create-account'],
  mergedProperties: ['submitButtonStateText'],

  store: Ember.inject.service (),

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
  isVerifying: Ember.computed.equal ('state', 'waiting'),
  isSubmitting: Ember.computed.equal ('state', 'submitting'),

  submitButtonStateText: {
    waiting: 'Sign Up',
    verifying: 'Verifying...',
    submitting: 'Signing Up...'
  },

  submitButtonText: Ember.computed ('state', function () {
    let state = this.get ('state');
    return this.get (`submitButtonStateText.${state}`);
  }),

  confirmErrorMessage: Ember.computed ('confirmedPassword', function () {
    let {confirmedPassword,passwordMatches} = this.getProperties (['confirmedPassword','passwordMatches']);
    return Ember.isPresent (confirmedPassword) && !passwordMatches  ? 'The password does not match' : null;
  }),

  passwordMatches: Ember.computed ('{password,confirmedPassword}', function () {
    let {password,confirmPassword,confirmedPassword} = this.getProperties (['password','confirmPassword','confirmedPassword']);
    return !confirmPassword || (!Ember.isEmpty (password) && password === confirmedPassword);
  }),

  disabled: Ember.computed ('{state,useEmailForUsername,username,email,password,confirmPassword,confirmedPassword}', function () {
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

    return Ember.isEmpty (username) ||
      Ember.isEmpty (email) ||
      Ember.isEmpty (password) ||
      !passwordMatches;
  }),

  didCreateAccount: Ember.on ('didCreateAccount', function (account) {
    this.sendAction ('accountCreated', account);
  }),

  handleError: Ember.on ('error', function (xhr) {
    this.set ('state', 'waiting');
    let error = Ember.get (xhr, 'errors.0');

    if (Ember.isPresent (error)) {
      switch (error.code) {
        case 'create_failed':
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

      if (Ember.isPresent (recaptcha) && Ember.isEmpty (recaptcha.get ('value'))) {
        this.set ('state', 'verifying');
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

    if (Ember.isPresent (recaptcha)) {
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

      if (Ember.isPresent (recaptcha)) {
        recaptcha.set ('value');
      }

      this.trigger ('didCreateAccount', account);
    }).catch (xhr => {
      this.trigger ('error', xhr);
    });
  }
});
