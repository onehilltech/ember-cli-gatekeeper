import Ember from 'ember';
import SignInMixin from '../mixins/sign-in';

export default Ember.Controller.extend (SignInMixin, {
  actions: {
    /**
     * Action called by the sign in component after the sign in process is completed
     * successfully. This action must be bound to a Gatekeeper.SignInComponent in order
     * for the application to transition away from the sign in page.
     */
    signInComplete () {
      // Perform the redirect from the sign in page.
      let redirectTo = this.get ('redirectTo');

      if (Ember.isNone (redirectTo)) {
        // There is no redirect transition. So, we either transition to the default
        // transition route, or we transition to the index.
        let ENV = Ember.getOwner (this).resolveRegistration ('config:environment');
        let target = Ember.getWithDefault (ENV, 'gatekeeper.startRoute', 'index');

        this.transitionToRoute (target);
      }
      else {
        if (Ember.typeOf (redirectTo) === 'string') {
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
