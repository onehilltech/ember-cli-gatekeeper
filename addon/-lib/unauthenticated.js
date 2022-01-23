import { get } from '@ember/object';
import { getOwner } from '@ember/application';
import { isPresent } from '@ember/utils';

import override from '@onehilltech/override';
import decorator from '@onehilltech/decorator';

/**
 * Implementation of the unauthenticated decorator.
 *
 * @param target
 * @param name
 * @param descriptor
 * @param options
 */
function unauthenticated (target, name, descriptor, options = {}) {
  const {
    accessTokenParamName = 'access_token',
    redirectTo
  } = options;

  /**
   * Check that the current user is authenticated.
   *
   * @param transition
   * @private
   */
  target.prototype._checkNotSignedIn = async function (transition) {
    const { to: { queryParams = {}}} = transition;
    const accessToken = queryParams[accessTokenParamName];

    if (isPresent (accessToken)) {
      // There is an access token in the query parameters. This takes precedence over the
      // status of the session.
      try {
        await this.session.openFrom (accessToken);
        return true;
      }
      catch (err) {
        return false;
      }
    }
    else {
      return !this.session.isSignedIn;
    }
  }

  // Make sure there is an actions object.
  target.prototype.actions = target.prototype.actions || {};

  override.async (target.prototype, 'beforeModel', async function (transition) {
    const notSignedIn = await this._checkNotSignedIn (transition);

    if (!notSignedIn) {
      // The user is signed into the application. Let's route the user to the start
      // route for the application.

      const ENV = getOwner (this).resolveRegistration ('config:environment');
      const targetRoute = redirectTo || get (ENV, 'gatekeeper.startRoute');

      if (isPresent (targetRoute)) {
        return this.replaceWith (targetRoute);
      }
      else {
        return this._super.call (this, ...arguments);
      }
    }
    else {
      return this._super.call (this, ...arguments);
    }
  });
}

export default decorator (unauthenticated);
