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
    let type = this.get ('type');
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

  isSigningIn: false,

  init () {
    this._super (...arguments);

    let ENV = Ember.getOwner (this).resolveRegistration ('config:environment');
    let recaptcha = Ember.get (ENV, 'ember-cli-google.recaptcha');

    if (Ember.isPresent (recaptcha)) {
      let type = Ember.getWithDefault (recaptcha, 'type', 'invisible');
      this.set ('recaptcha', ReCaptcha.create ({type}));
    }
  },

  actions: {
    signIn () {
      // Reset the current error message.
      this.set ('errorMessage');

      let recaptcha = this.get ('recaptcha');

      if (Ember.isPresent (recaptcha) && Ember.isEmpty (recaptcha.get ('value'))) {
        // We are using recaptcha to determine if current user is not a robot.
        recaptcha.set ('reset', true);
      }
      else {
        this._doSignIn ();
      }
    }
  },

  _isHuman: Ember.observer ('recaptcha.value', function () {
    let {recaptcha, canSubmit} = this.getProperties (['recaptcha', 'canSubmit']);
    let {type, value} = recaptcha.getProperties (['type', 'value']);

    if (canSubmit) {
      if (Ember.isPresent (value) && type === 'invisible') {
        this._doSignIn ();
      }
    }
  }),

  disabled: Ember.computed ('isSigningIn', 'username', 'password', 'recaptcha.value', function () {
    let {username, password, isSigningIn} = this.getProperties (['username', 'password', 'isSigningIn']);

    return isSigningIn ||
      Ember.isEmpty (username) ||
      Ember.isEmpty (password) ||
      (Ember.get (this, 'recaptcha.type') === 'v2' && Ember.isEmpty (Ember.get (this, 'recaptcha.value')));
  }),

  canSubmit: Ember.computed.not ('disabled'),

  doSigningIn () {
    this.set ('isSigningIn', true);
  },

  didSignIn () {
    this.set ('isSigningIn', false);
  },

  doSignInFailed () {
    this.set ('isSigningIn', false);
  },

  _doSignIn () {
    // Login the user.
    let {username, password, signInOptions, recaptcha} = this.getProperties (['username', 'password', 'signInOptions', 'recaptcha']);
    let opts = Ember.merge ({username, password}, signInOptions);

    if (Ember.isPresent (recaptcha)) {
      opts.recaptcha = this.get ('recaptcha.value');
    }

    this.doSigningIn ();

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
              this.setProperties ({'recaptcha.value': null, usernameErrorMessage: errors.message});
              break;

            case 'invalid_password':
              this.setProperties ({'recaptcha.value': null, passwordErrorMessage: errors.message});
              break;

            default:
              this.setProperties ({'recaptcha.value': null, errorMessage: errors.message});
          }
        }
        else {
          this.setProperties ({'recaptcha.value': null, errorMessage: xhr.statusText});
        }

        // Notify the component the sign in has failed.
        this.doSignInFailed ();
      });
    });
  }
});
