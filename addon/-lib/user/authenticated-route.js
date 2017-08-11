import Ember from 'ember';

export default Ember.Route.extend ({
  gatekeeper: Ember.inject.service (),

  beforeModel (transition) {
    this._super (...arguments);

    let isSignedIn = this.get ('gatekeeper.isSignedIn');

    if (!isSignedIn) {
      let ENV = this.getOwner (this).resolveRegistration ('config:environment');
      let signInRoute = Ember.getWithDefault (ENV, 'gatekeeper.signInRoute', 'signIn');
      let signInController = this.controllerFor (signInRoute);

      // Set the redirect to route so we can come back to this route when the
      // user has signed in.
      signInController.set ('redirectTo', transition);

      this.transitionTo (signInRoute);
    }
  }
});
