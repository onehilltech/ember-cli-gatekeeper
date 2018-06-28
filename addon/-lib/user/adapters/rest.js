import Ember from 'ember';
import DS from 'ember-data';

export default DS.RESTAdapter.extend ({
  /// The router service, which is used by the adapter to force the
  /// application to transition to the sign in page after unauthorized
  /// access.
  router: Ember.inject.service (),

  session: Ember.inject.service (),

  host: Ember.computed.readOnly ('session.client.baseUrl'),

  headers: Ember.computed ('session.accessToken', function () {
    let accessToken = this.get ('session.accessToken.access_token');
    return { Authorization: `Bearer ${accessToken}` };
  }),

  headersForRequest () {
    let headers = this._super (...arguments);
    headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';

    return headers;
  }
});
