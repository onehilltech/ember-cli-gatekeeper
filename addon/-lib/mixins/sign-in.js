import Ember from 'ember';

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

  actions: {
    signIn () {
      // Reset the current error message.
      this.set ('errorMessage');

      let usesRecaptcha = this.get ('usesRecaptcha');

      if (usesRecaptcha) {
        // We are using recaptcha to determine if current user is not a robot.
        this.set ('resetRecaptcha', true);
      }
      else {
        this._doSignIn ();
      }
    }
  },

  _isHuman: Ember.observer ('recaptcha', function () {
    let recaptcha = this.get ('recaptcha');

    if (Ember.isPresent (recaptcha)) {
      this._doSignIn ();
    }
  }),

  _doSignIn () {
    // Login the user.
    let {username, password, signInOptions, usesRecaptcha} = this.getProperties (['username', 'password', 'signInOptions', 'usesRecaptcha']);
    let opts = Ember.merge ({username, password}, signInOptions);

    if (usesRecaptcha) {
      opts.recaptcha = this.get ('recaptcha');
    }

    this.set ('isSigningIn', true);

    this.get ('gatekeeper').signIn (opts).then (() => {
      Ember.run.schedule ('actions', () => {
        this.set ('isSigningIn', false);
        this.didSignIn ();
      });
    }).catch ((xhr) => {
      Ember.run.schedule ('actions', () => {
        if (xhr.status === 400) {
          let errors = xhr.responseJSON.errors;

          switch (errors.code) {
            case 'invalid_username':
              this.setProperties ({recaptcha: null, isSigningIn: false, usernameErrorMessage: errors.message});
              break;

            case 'invalid_password':
              this.setProperties ({recaptcha: null, isSigningIn: false, passwordErrorMessage: errors.message});
              break;

            default:
              this.setProperties ({recaptcha: null, isSigningIn: false, errorMessage: errors.message});
          }
        }
        else {
          this.setProperties ({recaptcha: null, isSigningIn: false, errorMessage: xhr.statusText});
        }
      });
    });
  }
});
