import Ember from 'ember';
import DS from 'ember-data';

export default DS.RESTAdapter.extend({
  gatekeeper: Ember.inject.service (),

  host: Ember.computed.readOnly ('gatekeeper.client.baseUrl'),

  namespace: Ember.computed ('gatekeeper.client.version', function () {
    return `v${this.get ('gatekeeper.client.version')}`;
  }),

  headers: Ember.computed ('gatekeeper.userToken', function () {
    return { Authorization: `Bearer ${this.get ('gatekeeper.userToken.access_token')}` };
  }),

  handleResponse (status, headers, payload, requestData) {
    switch (status) {
      case 403:
        switch (payload.errors.code) {
          case 'unknown_token':
            // The token we are using is invalid. We need to force the service to
            // sign out the current user.
            this.get ('gatekeeper').forceSignOut ();
            break;
        }
        break;
    }

    return this._super (...arguments);
  }
});
