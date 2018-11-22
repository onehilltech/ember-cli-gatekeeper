import Mixin from '@ember/object/mixin';
import { getOwner } from '@ember/application';
import { getWithDefault } from '@ember/object';
import { isPresent } from '@ember/utils';

/**
 * A mixin that redirects the user to the start route if they are sign in. This
 * mixin ensures users accessing it are not authenticated.
 */
export default Mixin.create({
  beforeModel () {
    let isSignedIn = this.get ('session.isSignedIn');

    if (isSignedIn) {
      let ENV = getOwner (this).resolveRegistration ('config:environment');
      let startRoute = getWithDefault (ENV, 'gatekeeper.startRoute', 'index');
      this.replaceWith (startRoute);
    }
  }
});
