import Route from '@ember/routing/route';
import { getOwner } from '@ember/application';
import { getWithDefault } from '@ember/object';

export default Route.extend ({
  beforeModel () {
    if (!this.get ('session.isSignedIn')) {
      return this._super (...arguments);
    }

    // Transition to the start route.
    let ENV = getOwner (this).resolveRegistration ('config:environment');
    let startRoute = getWithDefault (ENV, 'gatekeeper.startRoute', 'index');

    this.replaceWith (startRoute);
  }
});
