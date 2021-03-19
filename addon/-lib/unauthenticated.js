import { get } from '@ember/object';
import { getOwner } from '@ember/application';
import { isPresent } from '@ember/utils';

import override from "./-override";

function applyDecorator (target, options = {}) {
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
  target.prototype._checkNotSignedIn = function (transition) {
    let { to: { queryParams = {}}} = transition;
    const accessToken = queryParams[accessTokenParamName];

    if (isPresent (accessToken)) {
      // There is an access token in the query parameters. This takes precedence over the
      // status of the session.
      return this.session.openFrom (accessToken).then (() => false).catch (() => true);
    }
    else {
      return Promise.resolve (!this.session.isSignedIn);
    }
  }

  // Make sure there is an actions object.
  target.prototype.actions = target.prototype.actions || {};

  override (target.prototype, 'beforeModel', function (transition) {
    return Promise.resolve (this._super.call (this, ...arguments))
      .then (() => this._checkNotSignedIn (transition))
      .then (notSignedIn => {
        if (notSignedIn === false) {
          // The user is signed into the application. Let's route the user to the start
          // route for the application.

          let ENV = getOwner (this).resolveRegistration ('config:environment');
          let targetRoute = redirectTo || get (ENV, 'gatekeeper.startRoute');

          if (isPresent (targetRoute)) {
            this.replaceWith (targetRoute);
          }
        }
      });
  });
}


export default function unauthenticated (target) {
  if (typeof target === 'function') {
    return applyDecorator (target);
  }
  else {
    let options = target;

    return function (target) {
      return applyDecorator (target, options);
    }
  }
}
