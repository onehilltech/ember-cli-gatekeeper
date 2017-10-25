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
