import Ember from 'ember';

/**
 * @class ReCaptcha
 *
 * Utility class that bags properties related to reCAPTCHA support.
 */
const ReCaptcha = Ember.Object.extend ({
  /// Reset the ReCaptcha component
  reset: false,

  /// The verified value of the ReCaptcha.
  value: null,

  /// The ReCaptcha has expired.
  expired: false,

  componentName: Ember.computed ('type', function () {
    let type = this.getWithDefault ('type', 'invisible');
    return `g-recaptcha-${type}`;
  })
});

/**
 * SignInMixin allows you to add sign in support to any object in EmberJS. It
 * is primarily used both Ember.Controller and Ember.Component objects. The
 * mixin supplies a signIn action, and states that inform the client of its
 * progress.
 *
 * Use \a signInOptions property to pass options to the sign in process.
 */
export default Ember.Mixin.create ({
  mergedProperties: ['signInOptions'],

  gatekeeper: Ember.inject.service (),

  signInOptions: {},

  init () {
    this._super (...arguments);

    let ENV = Ember.getOwner (this).resolveRegistration ('config:environment');
    let recaptcha = Ember.get (ENV, 'ember-cli-google.recaptcha');

    if (Ember.isPresent (recaptcha)) {
      let type = Ember.get (recaptcha, 'type');
      this.set ('recaptcha', ReCaptcha.create ({type}));
    }
  },

  actions: {
    signIn () {
      // Reset the current error message.
      this.set ('errorMessage');

      let recaptcha = this.get ('recaptcha');

      if (recaptcha) {
        // We are using recaptcha to determine if current user is not a robot.
        this.set ('recaptcha.reset', true);
      }
      else {
        this._doSignIn ();
      }
    }
  },

  _isHuman: Ember.observer ('recaptcha.value', function () {
    let value = this.get ('recaptcha.value');

    if (Ember.isPresent (value)) {
      this._doSignIn ();
    }
  }),

  _doSignIn () {
    // Login the user.
    let {username, password, signInOptions, recaptcha} = this.getProperties (['username', 'password', 'signInOptions', 'recaptcha']);
    let opts = Ember.merge ({username, password}, signInOptions);

    if (Ember.isPresent (recaptcha)) {
      opts.recaptcha = this.get ('recaptcha.value');
    }

    this.set ('isSigningIn', true);

    this.get ('gatekeeper').signIn (opts).then (() => {
      Ember.run.schedule ('actions', () => {
        this.didSignIn ();
      });
    }).catch ((xhr) => {
      Ember.run.schedule ('actions', () => {
        if (xhr.status === 400) {
          let errors = xhr.responseJSON.errors;

          switch (errors.code) {
            case 'invalid_username':
              this.setProperties ({'recaptcha.value': null, isSigningIn: false, usernameErrorMessage: errors.message});
              break;

            case 'invalid_password':
              this.setProperties ({'recaptcha.value': null, isSigningIn: false, passwordErrorMessage: errors.message});
              break;

            default:
              this.setProperties ({'recaptcha.value': null, isSigningIn: false, errorMessage: errors.message});
          }
        }
        else {
          this.setProperties ({'recaptcha.value': null, isSigningIn: false, errorMessage: xhr.statusText});
        }
      });
    });
  }
});
