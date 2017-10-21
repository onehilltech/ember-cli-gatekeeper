import Ember from 'ember';
import Material from 'ember-cli-mdl';

export default Material.Route.extend ({
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
  }
});
