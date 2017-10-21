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

  actions: {
    signIn () {
      // Reset the current error message.
      this.set ('errorMessage');

      // Login the user.
      let username = this.get ('username');
      let password = this.get ('password');
      let signInOptions = this.get ('signInOptions');
      let opts = Ember.merge ({username: username, password: password}, signInOptions);

      this.set ('isSigningIn', true);

      this.get ('gatekeeper').signIn (opts).then (() => {
        Ember.run.schedule ('actions', () => {
          // Notify all that we are finish with the sign in process.
          this.set ('isSigningIn', false);
          this.didSignIn ();
        });
      }).catch ((xhr) => {
        Ember.run.schedule ('actions', () => {
          if (xhr.status === 400) {
            let errors = xhr.responseJSON.errors;

            switch (errors.code) {
              case 'invalid_username':
                this.setProperties ({isSigningIn: false, usernameErrorMessage: errors.message});
                break;

              case 'invalid_password':
                this.setProperties ({isSigningIn: false, passwordErrorMessage: errors.message});
                break;

              default:
                this.setProperties ({isSigningIn: false, errorMessage: errors.message});
            }
          }
          else {
            this.setProperties ({isSigningIn: false, errorMessage: xhr.statusText});
          }
        });
      });
    }
  }
});
