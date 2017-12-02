import Ember from 'ember';
import ReCaptcha from "../mixins/recaptcha";

export default Ember.Component.extend (Ember.Evented, ReCaptcha, {
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

  gatekeeper: Ember.inject.service (),

  signInOptions: {},

  submitButtonStateText: {
    signedOut: 'Sign In',
    signingIn: 'Signing In...',
    verifying: 'Verifying...'
  },

  submitButtonText: Ember.computed ('state', function () {
    let state = this.get ('state');
    return this.get (`submitButtonStateText.${state}`);
  }),

  state: 'signedOut',
  isSignedOut: Ember.computed.equal ('state', 'signedOut'),
  isSigningIn: Ember.computed.equal ('state', 'signingIn'),

  disabled: Ember.computed ('{state,username,password}', 'recaptcha.value', function () {
    let {username, password,state} = this.getProperties (['username', 'password', 'state']);

    return Ember.isEmpty (username) ||
      Ember.isEmpty (password) ||
      (Ember.get (this, 'recaptcha.type') === 'v2' && Ember.isEmpty (Ember.get (this, 'recaptcha.value'))) ||
      state !== 'signedOut';
  }),

  willSignIn () {
    this.set ('state', 'signingIn');
  },

  didSignIn () {
    this.set ('state', 'signedIn');
    this.sendAction ('signInComplete');
  },

  handleError: Ember.on ('error', function (xhr) {
    this.set ('state', 'signedOut');

    let error = Ember.get (xhr, 'responseJSON.errors.0');

    if (Ember.isPresent (error)) {
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

      if (Ember.isPresent (recaptcha) && Ember.isEmpty (recaptcha.get ('value'))) {
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
    let opts = Ember.merge ({username, password}, signInOptions);

    if (Ember.isPresent (recaptcha)) {
      opts.recaptcha = recaptcha.get ('value');
    }

    this.willSignIn ();

    this.get ('gatekeeper').signIn (opts).then (() => {
      this.didSignIn ();
    }).catch (xhr => {
      this.trigger ('error', xhr);
    });
  }
});
