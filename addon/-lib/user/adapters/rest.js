import Ember from 'ember';
import DS from 'ember-data';

export default DS.RESTAdapter.extend({
  gatekeeper: Ember.inject.service (),

  host: Ember.computed.readOnly ('gatekeeper.client.baseUrl'),

  namespace: Ember.computed ('gatekeeper.client.version', function () {
    return `v${this.get ('gatekeeper.client.version')}`;
  }),

  headers: Ember.computed ('gatekeeper.session', function () {
    return { Authorization: `Bearer ${this.get ('gatekeeper.accessToken')}` };
  })
});
