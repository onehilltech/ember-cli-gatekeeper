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
        // There is a problem with our token. Force the user to authenticate
        // again with hopes of resolving the problem.
        this.get ('gatekeeper').forceSignOut (payload.errors.message);
        break;
    }

    return this._super (...arguments);
  }
});
