import Ember from 'ember';
import ReCaptcha from './recaptcha';

/**
 * SignInMixin allows you to add sign in support to any object in EmberJS. It
 * is primarily used both Ember.Controller and Ember.Component objects. The
 * mixin supplies a signIn action, and states that inform the client of its
 * progress.
 *
 * Use \a signInOptions property to pass options to the sign in process.
 */
export default Ember.Mixin.create (Ember.Evented, ReCaptcha, {
  mergedProperties: ['signInOptions'],

  gatekeeper: Ember.inject.service (),

  signInOptions: {},

  isSigningIn: false,

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
    this.set ('isSigningIn', false);
  },

  doSignInFailed () {
    this.set ('isSigningIn', false);
  },

  _doSubmit () {
    // Login the user.
    let {username, password, signInOptions, recaptcha} = this.getProperties (['username', 'password', 'signInOptions', 'recaptcha']);
    let opts = Ember.merge ({username, password}, signInOptions);

    if (Ember.isPresent (recaptcha)) {
      opts.recaptcha = recaptcha.get ('value');
    }

    this.trigger ('willSignIn');
    this.willSignIn ();

    this.get ('gatekeeper').signIn (opts).then (() => {
      this.trigger ('didSignIn');
      this.didSignIn ();
    }).catch ((reason) => {
      let errors = Ember.A (reason.responseJSON.errors);

      if (Ember.isPresent (errors)) {
        let firstError = errors.get ('firstObject');

        if (Ember.isPresent (firstError)) {
          switch (firstError.code) {
            case 'invalid_username':
              this.setProperties ({usernameErrorMessage: firstError.detail});
              break;

            case 'invalid_password':
              this.setProperties ({passwordErrorMessage: firstError.detail});
              break;

            default:
              this.setProperties ({errorMessage: firstError.detail});
          }
        }
      }
      else {
        this.setProperties ({errorMessage: reason.statusText});
      }

      // Notify the component the sign in has failed.
      this.trigger ('error', reason);

      this.doSignInFailed ();
    });
  }
});
