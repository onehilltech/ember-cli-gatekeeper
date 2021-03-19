import { get, getWithDefault, set } from '@ember/object';
import { isEmpty, isPresent } from '@ember/utils';
import { getOwner } from '@ember/application';

import override from "./-override";

const bearerErrorCodes = [
  'invalid_token',
  'unknown_token',
  'token_disabled',
  'unknown_client',
  'client_disabled',
  'unknown_account',
  'account_disabled'
];

function applyDecorator (target, options = {}) {
  const {
    scope,
    redirectParamName = 'redirect',
    accessTokenParamName = 'access_token'
  } = options;

  /**
   * Check that the current user is authenticated.
   *
   * @param transition
   * @private
   */
  target.prototype._checkSignedIn = function (transition) {
    let { to: { queryParams = {}}} = transition;
    const accessToken = queryParams[accessTokenParamName];

    if (isPresent (accessToken)) {
      // There is an access token in the query parameters. This takes precedence over the
      // status of the session.
      return this.session.openFrom (accessToken).then (() => true).catch (() => false);
    }
    else if (this.session.isSignedIn) {
      return Promise.resolve (true);
    }
    else {
      return Promise.resolve (false);
    }
  }

  // Make sure there is an actions object.
  target.prototype.actions = target.prototype.actions || {};

  // Define the error handling routine/action.
  target.prototype.actions.error = function (reason) {
    let errors = get (reason, 'errors');

    if (isEmpty (errors)) {
      return true;
    }

    for (let i = 0, len = errors.length; i < len; ++ i) {
      let error = errors[i];

      if (error.status === '403' && bearerErrorCodes.indexOf (error.code) !== -1) {
        // Redirect to sign in page, allowing the user to redirect back to the
        // original page. But, do not support the back button.
        let ENV = getOwner (this).resolveRegistration ('config:environment');
        let signInRoute = getWithDefault (ENV, 'gatekeeper.signInRoute', 'sign-in');

        // Display the error message.
        this.snackbar.show ({message: error.detail});

        // Force the user to sign out.
        this.session.signOut (true).then (() => {
          this.replaceWith (signInRoute);
        });

        return;
      }
    }

    return true;
  }

  override (target.prototype, 'beforeModel', function (transition) {
    return Promise.resolve (this._super.call (this, ...arguments))
      .then (() => this._checkSignedIn (transition))
      .then (authenticated => {
        if (authenticated) {
          let authorized = isEmpty (scope) || this.session.accessToken.supports (scope);
          let controller = this.controllerFor (this.routeName, true);

          if (isPresent (controller)) {
            set (controller, 'isAuthorized', authorized);
          }

          if (!authorized && isPresent (target.prototype.actions.unauthorized)) {
            transition.trigger ('unauthorized', transition);
          }
        }
        else {
          // The user is not signed into the application. Let's route the user to the
          // sign-in route for the application.

          let ENV = getOwner (this).resolveRegistration ('config:environment');
          let signInRoute = get (ENV, 'gatekeeper.signInRoute');

          if (isPresent (signInRoute)) {
            // Set the redirect to route so we can come back to this route when the
            // user has signed in.
            let options = { queryParams: { [redirectParamName]: transition.targetName } };
            this.replaceWith (signInRoute, options);
          }
        }
      });
  });
}

export default function authenticated (target) {
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
