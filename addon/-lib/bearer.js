import Mixin from '@ember/object/mixin';
import { isNone } from '@ember/utils';
import { reject } from 'rsvp';
import decorator from '@onehilltech/decorator';

const USER_SCOPE = 'user';

/**
 * The ajax function used in the mixin and the override approach.
 *
 * @param url
 * @param type
 * @param options
 * @returns {*}
 */
function ajax (url, type, options) {
  // We are going to intercept the original request before it goes out and
  // replace the error handler with our error handler.
  const _ajax = this._super.bind (this);

  return this._super (...arguments).catch (err => {
    if (isNone (err.errors)) {
      return reject (err);
    }

    const {errors: [{code, status}]} = err;

    if (status !== '403' || code !== 'token_expired') {
      return reject (err);
    }

    // Refresh the access token, and try the request again. If the request fails
    // a second time, then return the original error.
    let refreshToken = this.session.isSignedIn ?
      this.session.refresh () :
      this.session.gatekeeper.authenticate (true);

    return refreshToken
      .then (() => _ajax (url, type, options))
      .catch (() => reject (err));
  });
}

/**
 * @mixin BearerMixin
 *
 * The mixin for adding bearer authorization support to an REST adapter. We
 * use a mixin for the integration because the RESTAdapter still uses the
 * EmberObject under the hood.
 */

// eslint-disable-next-line ember/no-new-mixins
const BearerMixin = Mixin.create ({
  ajax
});

/**
 * Implementation of the bearer decorator.
 *
 * @param target
 * @param name
 * @param descriptor
 * @param options
 */
function bearer (target, name, descriptor, options = {}) {
  const {
    scope = USER_SCOPE
  } = options;

  Object.defineProperty (target.prototype, 'accessToken', {
    get () {
      return scope === USER_SCOPE ? this.session.accessToken : this.session.gatekeeper.accessToken;
    }
  });

  Object.defineProperty (target.prototype, 'headers', {
    get () {
      let headers = {
        'Cache-Control': 'private, max-age=0, no-cache, no-store'
      };

      let accessToken = scope === USER_SCOPE && this.session.isSignedIn ?
        this.session.accessToken.toString () :
        this.session.gatekeeper.accessToken.toString ();

      headers.Authorization = `Bearer ${accessToken}`;

      return headers;
    }
  });

  // Extend the current REST adapter with the bearer mixin.
  return target.extend (BearerMixin);
}

export default decorator (bearer);
