import Ember from 'ember';

export default Ember.Route.extend ({
  gatekeeper: Ember.inject.service (),

  beforeModel () {
    if (this.get ('gatekeeper.isSignedIn')) {
      // Transition to the start route.
      let ENV = Ember.getOwner (this).resolveRegistration ('config:environment');
      let startRoute = Ember.getWithDefault (ENV, 'gatekeeper.startRoute', 'index');

      this.replaceWith (startRoute);
    }
    else {
      return this._super (...arguments);
    }
  },

  activate () {
    this._super (...arguments);
    Ember.$ ('body').addClass ('sign-in');
  },

  deactivate () {
    this._super (...arguments);
    Ember.$ ('body').removeClass ('sign-in');
  }
});
