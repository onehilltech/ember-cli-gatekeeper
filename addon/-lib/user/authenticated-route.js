import Ember from 'ember';
import Material from 'ember-cli-mdl';

const bearerErrorCodes = [
  'invalid_token',
  'unknown_token',
  'token_disabled',
  'unknown_client',
  'client_disabled',
  'unknown_account',
  'account_disabled'
];

export default Material.Route.extend ({
  capabilities: [],

  concatenatedProperties: ['capabilities'],

  currentUser: Ember.computed ('gatekeeper.currentUser', function () {
    let currentUser = this.get ('gatekeeper.currentUser');

    if (Ember.isNone (currentUser)) {
      return null;
    }

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

    if (!this._checkCapabilities ()) {
      this.missingCapability (transition);
    }
  },

  missingCapability (transition) {
    alert ('Sorry! You do not have access to this page.');
    transition.abort ();
  },

  actions: {
    error (reason, transition) {
      let errors = Ember.get (reason, 'errors');

      if (Ember.isEmpty (errors))
        return true;

      for (let i = 0, len = errors.length; i < len; ++ i) {
        let error = errors[i];

        if (error.status === '403' && bearerErrorCodes.indexOf (error.code) !== -1) {
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
          return;
        }
      }

      return true;
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
      if (Ember.isPresent (signInController)) {
        signInController.set ('redirectTo', transition);
      }

      this.replaceWith (signInRoute);
    }
  },

  _checkCapabilities () {
    let capabilities = this.get ('capabilities');
    return Ember.isEmpty (capabilities) ? true : this.get ('gatekeeper.metadata').hasCapability (capabilities);
  }
});
