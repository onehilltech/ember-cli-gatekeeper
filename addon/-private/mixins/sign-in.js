import Ember from 'ember';

/**
 * SignIn
 *
 * The sign in mixin can be used with both Ember.Controller and Ember.Component
 * objects. The mixin supplies a signIn action, and emits events that allows
 * subclassed to respond accordingly.
 */
export default Ember.Mixin.extend ({
  // The required gatekeeper service.
  gatekeeper: Ember.inject.service (),

  actions: {
    /**
     * Sign in the user using the provide username and password.
     */
    signIn () {
      const ENV = Ember.getOwner (this).resolveRegistration ('config:environment');
      const gatekeeperConfig = ENV.gatekeeper || {};

      let username = this.get ('username');
      let password = this.get ('password');
      let signInOptions = gatekeeperConfig.signInOptions || {};
      let opts = Ember.merge ({username: username, password: password}, signInOptions);

      // Let them know we have started the sign in process.
      this.set ('isSigningIn', true);

      this.get ('gatekeeper').signIn (opts).then (() => {
        // Notify all that we are finish with the sign in process.
        this.set ('isSigningIn', false);
        this.didSignIn ();

        // Perform the redirect from the sign in page.
        let redirectTo = this.get ('redirectTo');

        if (!Ember.isNone (redirectTo)) {
          // Retry the transition.
          redirectTo.retry ();
        }
        else {
          let defaultRedirectTo = gatekeeperConfig.defaultRedirectTo;

          if (Ember.isNone (defaultRedirectTo)) {
            defaultRedirectTo = 'index';
          }

          this.doTransition (defaultRedirectTo);
        }
      }).catch ((err) => {
        this.set ('isSigningIn', false);
        this.set ('signInError', err);
      });
    }
  }
});
