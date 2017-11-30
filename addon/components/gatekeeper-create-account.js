import ReCaptcha from '../-lib/mixins/recaptcha';
import layout from '../templates/components/gatekeeper-create-account';
import Ember from 'ember';

export default Ember.Component.extend (ReCaptcha, Ember.Evented, {
  layout,

  classNames: ['gk-form--create-account'],

  confirmPassword: true,

  submitButtonColor: 'primary',
  submitButtonText: 'Submit',

  usernameLabel: 'Username',
  usernamePlaceholder: null,

  emailLabel: 'Email address',
  emailPlaceholder: null,

  passwordLabel: 'Password',
  passwordPlaceholder: null,

  confirmPasswordLabel: 'Confirm password',
  confirmPasswordPlaceholder: null,

  confirmErrorMessage: Ember.computed ('confirmedPassword', function () {
    let {confirmedPassword,passwordMatches} = this.getProperties (['confirmedPassword','passwordMatches']);
    return Ember.isPresent (confirmedPassword) && !passwordMatches  ? 'The password does not match' : null;
  }),

  passwordMatches: Ember.computed ('{password,confirmedPassword}', function () {
    let {password,confirmPassword,confirmedPassword} = this.getProperties (['password','confirmPassword','confirmedPassword']);
    return !confirmPassword || (!Ember.isEmpty (password) && password === confirmedPassword);
  }),

  disableSubmit: Ember.computed ('{submitting,useEmailForUsername,username,email,password,confirmPassword,confirmedPassword}', function () {
    let {
      submitting,
      useEmailForUsername,
      username,
      email,
      password,
      passwordMatches
    } = this.getProperties (['submitting', 'useEmailForUsername','username','email','password','passwordMatches']);

    if (submitting) {
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
    this.set ('messageToUser', xhr.statusText);
  }),

  store: Ember.inject.service (),

  canSubmit: true,

  accountEnabled: true,

  actions: {
    createAccount () {
      // Reset the current error message.
      this.set ('errorMessage');

      let recaptcha = this.get ('recaptcha');

      if (Ember.isPresent (recaptcha) && Ember.isEmpty (recaptcha.get ('value'))) {
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

    this.trigger ('willCreateAccount');

    account.save ({adapterOptions}).then ((account) => {
      // Reset the form, including the ReCaptcha, if present.
      this.setProperties ({
        username: null,
        email: null,
        password: null,
        confirmedPassword: null,
      });

      if (Ember.isPresent (recaptcha)) {
        recaptcha.set ('value');
      }

      this.trigger ('didCreateAccount', account);
    }).catch (xhr => {
      this.trigger ('error', xhr);
    });
  }
});
