import Ember from 'ember';
import Material from 'ember-cli-mdl';

export default Material.Route.extend ({
  currentUser: Ember.computed ('gatekeeper.currentUser', function () {
    let currentUser = this.get ('gatekeeper.currentUser');
    let store = this.get ('store');

    let data = store.normalize ('account', currentUser);
    data.data.id = currentUser.id;

    return store.push (data);
  }),

  init () {
    this._super (...arguments);

    this.get ('gatekeeper').on ('signedOut', this, 'didSignOut');
  },

  destroy () {
    this._super (...arguments);

    this.get ('gatekeeper').off ('signedOut', this, 'didSignOut');
  },

  beforeModel (transition) {
    this._super (...arguments);
    this._checkSignedIn (transition);
  },

  actions: {
    error (reason, transition) {
      let errors = Ember.get (reason, 'errors');

      if (!Ember.isEmpty (errors)) {
        for (let i = 0, len = errors.length; i < len; ++ i) {
          let error = errors[i];

          if (error.status === '403') {
            // Redirect to sign in page, allowing the user to redirect back to the
            // original page. But, do not support the back button.
            let ENV = Ember.getOwner (this).resolveRegistration ('config:environment');
            let signInRoute = Ember.getWithDefault (ENV, 'gatekeeper.signInRoute', 'sign-in');
            let signInController = this.controllerFor (signInRoute);

            signInController.setProperties ({
              redirectTo: transition,
              errorMessage: error.detail
            });

            // Force the user to sign out.
            this.get ('gatekeeper').forceSignOut ();
            this.replaceWith (signInRoute);
          }
        }
      }
    }
  },

  didSignOut () {

  },

  _checkSignedIn (transition) {
    let isSignedIn = this.get ('gatekeeper.isSignedIn');

    if (!isSignedIn) {
      let ENV = Ember.getOwner (this).resolveRegistration ('config:environment');
      let signInRoute = Ember.getWithDefault (ENV, 'gatekeeper.signInRoute', 'sign-in');
      let signInController = this.controllerFor (signInRoute);

      // Set the redirect to route so we can come back to this route when the
      // user has signed in.
      signInController.set ('redirectTo', transition);

      this.replaceWith (signInRoute);
    }
  }
});
