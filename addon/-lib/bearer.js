import Mixin from '@ember/object/mixin';
import { isNone } from '@ember/utils';
import decorator from '@onehilltech/decorator';

const USER_SCOPE = 'user';

function ajax (url, type, options) {
  // We are going to intercept the original request before it goes out and
  // replace the error handler with our error handler.

  const ajax = this._super.bind (this);

  return ajax (...arguments).catch (err => {
    if (isNone (err.errors)) {
      throw err;
    }

    const { errors: [{ code }] } = err;

    if (code === 'invalid_token' || code === 'unknown_token' || code === 'token_expired' ) {
      // Refresh the access token, and try the request again. If the request fails
      // a second time, then return the original error.

      // Should we try to authenticate the client with the same options
      // contained in the token?!

      const refreshPromise = this.session.isSignedIn ?
        this.session.refresh () :
        this.session.gatekeeper.authenticate ({}, true);

      return refreshPromise.then (() => ajax (url, type, options));
    }
    else {
      throw err;
    }
  });
}

/**
 * The ajax function used in the mixin and the override approach.
 *
 * @param url
 * @param type
 * @param options
 * @returns {*}
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
      const  headers = { 'Cache-Control': 'private, max-age=0, no-cache, no-store' };

      const accessToken = scope === USER_SCOPE && this.session.isSignedIn ?
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
