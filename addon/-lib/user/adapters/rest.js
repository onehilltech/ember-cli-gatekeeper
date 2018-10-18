import DS from 'ember-data';

import { computed } from '@ember/object';
import { or } from '@ember/object/computed';
import { inject as service } from '@ember/service';
import { isNone } from '@ember/utils';
import { reject } from 'rsvp';

export default DS.RESTAdapter.extend ({
  /// The session service for Gatekeeper.
  session: service (),

  /// We are either going to use the session access token, or the client access token. We
  /// prefer the session access token to the client access token.
  accessToken: or ('session.accessToken','session.gatekeeper.accessToken'),

  /**
   * Get the default headers for the REST adapter.
   */
  headers: computed ('accessToken', function () {
    return {
      Authorization: `Bearer ${this.get ('accessToken.access_token')}`,
      'Cache-Control': 'private, max-age=0, no-cache, no-store'
    };
  }),

  /**
   * Execute an AJAX request.
   *
   * @private
   */
  ajax (url, type, options) {
    // We are going to intercept the original request before it goes out and
    // replace the error handler with our error handler.
    const adapter = this;
    const _super = this._super;

    return this._super (...arguments).catch (err => {
      if (isNone (err.errors)) {
        return reject (err);
      }

      const { errors: [{ code, status }]} = err;

      if (status !== '403' || code !== 'token_expired') {
        return reject (err);
      }

      // Refresh the access token, and try the request again. If the request fails
      // a second time, then return the original error.
      return this.get ('session').refreshToken ()
        .then (() => _super.call (adapter, url, type, options))
        .catch (() => reject (err));
    });
  }
});
