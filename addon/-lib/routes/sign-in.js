import { getWithDefault } from '@ember/object';
import { getOwner } from '@ember/application';
import Material from 'ember-cli-mdl';

export default Material.Route.extend ({
  beforeModel () {
    if (this.get ('session.isSignedIn')) {
      // Transition to the start route.
      let ENV = getOwner (this).resolveRegistration ('config:environment');
      let startRoute = getWithDefault (ENV, 'gatekeeper.startRoute', 'index');

      this.replaceWith (startRoute);
    }
    else {
      return this._super (...arguments);
    }
  }
});
