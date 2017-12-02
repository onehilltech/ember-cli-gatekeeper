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

  //== button

  signInButtonColored: true,
  signInText: 'Sign In',
  signingInText: 'Signing in...',

  enableShowPassword: true,

  mergedProperties: ['signInOptions'],

  gatekeeper: Ember.inject.service (),

  signInOptions: {},

  isSigningIn: false,

  disabled: Ember.computed ('isSigningIn', 'username', 'password', 'recaptcha.value', function () {
    let {username, password, isSigningIn} = this.getProperties (['username', 'password', 'isSigningIn']);

    return isSigningIn ||
      Ember.isEmpty (username) ||
      Ember.isEmpty (password) ||
      (Ember.get (this, 'recaptcha.type') === 'v2' && Ember.isEmpty (Ember.get (this, 'recaptcha.value')));
  }),

  canSubmit: Ember.computed.not ('disabled'),

  willSignIn () {
    this.set ('isSigningIn', true);
  },

  didSignIn () {
    this.sendAction ('signInComplete');
    this.set ('isSigningIn', false);
  },

  handleError: Ember.on ('error', function (xhr) {
    this.set ('isSigningIn', false);

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
      this.setProperties ('errorMessage', reason.statusText);
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
      if (Ember.isPresent (recaptcha)) {
        recaptcha.set ('value');
      }

      this.trigger ('error', xhr);
    });
  }
});
