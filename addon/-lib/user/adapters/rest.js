import Ember from 'ember';
import DS from 'ember-data';

export default DS.RESTAdapter.extend ({
  /// The router service, which is used by the adapter to force the
  /// application to transition to the sign in page after unauthorized
  /// access.
  router: Ember.inject.service (),

  gatekeeper: Ember.inject.service (),

  host: Ember.computed.readOnly ('gatekeeper.client.baseUrl'),

  namespace: Ember.computed ('gatekeeper.client.version', function () {
    return `v${this.get ('gatekeeper.client.version')}`;
  }),

  headers: Ember.computed ('gatekeeper.userToken', function () {
    return { Authorization: `Bearer ${this.get ('gatekeeper.userToken.access_token')}` };
  }),

  handleResponse (status, headers, payload) {
    switch (status) {
      case 403: {
        // There is a problem with our token. Force the user to authenticate
        // again with hopes of resolving the problem.
        this.get ('gatekeeper').forceSignOut (payload.errors.message);
        this._forceUserToSignIn ();

        break;
      }
    }

    return this._super (...arguments);
  },

  _forceUserToSignIn () {
    let owner = Ember.getOwner (this);

    // Get the router so we can transition to te sign-in page. We are going to
    // allow the user to redirect back to the original page after they complete
    // the sign in process.
    let ENV = owner.resolveRegistration ('config:environment');
    let signInRoute = Ember.getWithDefault (ENV, 'gatekeeper.signInRoute', 'sign-in');

    let router = this.get ('router');
    let route = owner.lookup(`route:${signInRoute}`);
    let controllerName = signInRoute;

    if (route && route.controllerName) {
      controllerName = route.controllerName;
    }

    let controller = owner.lookup (`controller:${controllerName}`);
    let currentRouteName = router.get ('currentRouteName');

    controller.set ('redirectTo', currentRouteName);
    router.replaceWith (signInRoute);
  }
});
