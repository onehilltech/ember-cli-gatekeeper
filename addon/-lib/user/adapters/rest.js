import DS from 'ember-data';

import { inject as service } from '@ember/service';
import { isNone, isPresent } from '@ember/utils';
import { reject } from 'rsvp';

export default class RestAdapter extends DS.RESTAdapter {
  /// The session service for Gatekeeper.
  @service
  session;

  /// We are either going to use the session access token, or the client access token. We
  /// prefer the session access token to the client access token.
  get accessToken () {
    return this.session.accessToken.toString () || this.session.gatekeeper.accessToken.toString ();
  }

  /**
   * Get the default headers for the REST adapter.
   */
  get headers () {
    let accessToken = this.accessToken;

    let headers = {
      'Cache-Control': 'private, max-age=0, no-cache, no-store'
    };

    if (isPresent (accessToken)) {
      headers.Authorization = `Bearer ${accessToken}`;
    }

    return headers;
  }

  /**
   * Execute an AJAX request.
   *
   * @private
   */
  ajax (url, type, options) {
    // We are going to intercept the original request before it goes out and
    // replace the error handler with our error handler.
    return super.ajax (...arguments).catch (err => {
      if (isNone (err.errors)) {
        return reject (err);
      }

      const { errors: [{ code, status }]} = err;

      if (status !== '403' || code !== 'token_expired') {
        return reject (err);
      }

      // Refresh the access token, and try the request again. If the request fails
      // a second time, then return the original error.
      return this.session.refresh ()
        .then (() => super.ajax (url, type, options))
        .catch (() => reject (err));
    });
  }
}
