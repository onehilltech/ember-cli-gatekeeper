import Mixin from '@ember/object/mixin';

import { getOwner } from '@ember/application';
import { getWithDefault } from '@ember/object';
import { isNone, typeOf } from '@ember/utils';

export default Mixin.create ({
  actions: {
    complete () {
      // Perform the redirect from the sign in page.
      let redirectTo = this.get ('redirectTo');

      if (isNone (redirectTo)) {
        // There is no redirect transition. So, we either transition to the default
        // transition route, or we transition to the index.
        let ENV = getOwner (this).resolveRegistration ('config:environment');
        let target = getWithDefault (ENV, 'gatekeeper.startRoute', 'index');

        this.replaceRoute (target);
      }
      else {
        if (typeOf (redirectTo) === 'string') {
          // We either have a url or a route name.
          this.replaceRoute (redirectTo);
        }
        else {
          // The redirect is a Transition object. We are just going to retry the
          // transition object.
          redirectTo.retry ();
        }

        // Reset the redirect property.
        this.set ('redirectTo');
      }
    }
  }
});
