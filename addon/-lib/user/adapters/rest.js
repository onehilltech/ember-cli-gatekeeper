import DS from 'ember-data';

import { computed } from '@ember/object';
import { readOnly } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { Promise } from 'rsvp';

export default DS.RESTAdapter.extend ({
  /// The router service, which is used by the adapter to force the
  /// application to transition to the sign in page after unauthorized
  /// access.
  router: service (),

  /// The session service for Gatekeeper.
  session: service (),

  /// Get the host from the base url for the client.
  host: readOnly ('session.gatekeeper.baseUrl'),

  headers: computed ('session.accessToken', function () {
    let accessToken = this.get ('session.accessToken.access_token');
    return { Authorization: `Bearer ${accessToken}` };
  }),

  headersForRequest () {
    let headers = this._super (...arguments);
    headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';

    return headers;
  },

  /**
   * Handle the AJAX request.
   *
   * @param hash
   * @private
   */
  _makeRequest (request) {
    // We are going to intercept the original request before it goes out and
    // replace the error handler with our error handler.
    const base = this._super.bind (this);

    return this._super (request).catch (err => {
      const { errors: [{ code, status }]} = err;

      if (status !== '403' || code !== 'token_expired') {
        return Promise.reject (err);
      }

      // The token has expired. Try to refresh the token, and then retry the original
      // request again.
      return this.get ('session').refreshToken ()
        .then (() => {
          // Replace the current authorization header with the new access token.
          const {access_token:accessToken} = this.get ('session.accessToken');
          request.headers['Authorization'] = `Bearer ${accessToken}`;

          // Retry the same request again. This time we are not concerned if the
          // request fails, and will let it bubble to the caller.
          return base (request);
        }).catch (() => {
          // We failed to refresh our token. Send the original error message.
          return Promise.reject (err);
        })
    });
  }
});
