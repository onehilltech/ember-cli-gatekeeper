import { get, getWithDefault } from '@ember/object';
import { isEmpty, isPresent, isNone } from '@ember/utils';
import { getOwner } from '@ember/application';

import override from '@onehilltech/override';
import decorator from '@onehilltech/decorator';

function noOp () {}

const bearerErrorCodes = [
  'invalid_token',
  'unknown_token',
  'token_disabled',
  'unknown_client',
  'client_disabled',
  'unknown_account',
  'account_disabled'
];

function authenticated (target, name, descriptor, options = {}) {
  const {
    scope,
    redirectParamName = 'redirect',
    accessTokenParamName = 'access_token',
    skipAccountLookup = false,
    secretOrPublicKey,
    verifyOptions,
    signInAction = 'redirect'
  } = options;

  let {
    signInRoute
  } = options;

  /**
   * Check that the current user is authenticated.
   *
   * @param transition
   * @private
   */
  target.prototype._checkSignedIn = async function (transition) {
    const { to: { queryParams = {}}} = transition;
    const accessToken = queryParams[accessTokenParamName];

    if (isPresent (accessToken)) {
      // There is an access token in the query parameters. This takes precedence over the
      // status of the session.
      const options = {
        verified: this.verified || noOp,
        skipAccountLookup,
        secretOrPublicKey,
        verifyOptions
      };

      try {
        await this.session.openFrom (accessToken, options);
        return true;
      }
      catch (err) {
        return false;
      }
    }
    else if (this.session.isSignedIn) {
      // The user is signed into the current session. Let's check if the access token has expired. if
      // so, then we need to refresh the access token. If we fail at refreshing the token, the let's
      // reset the session before continuing.

      if (this.session.accessToken.isExpired) {
        try {
          await this.session.refresh ();
          return true;
        }
        catch (err) {
          this.session.reset ();
          return false;
        }
      }
      else {
        return true;
      }
    }
    else {
      return false;
    }
  }

  // Make sure there is an actions object.
  target.actions = target.actions || {};

  // Define the error handling routine/action.
  target.actions.error = async function (reason) {
    const errors = get (reason, 'errors');

    if (isEmpty (errors)) {
      return true;
    }

    for (let i = 0, len = errors.length; i < len; ++ i) {
      const { code, detail } = errors[i];

      if (bearerErrorCodes.includes (code)) {
        if (this.session.isSignedIn) {
          // Redirect to sign in page, allowing the user to redirect back to the
          // original page. But, do not support the back button. We aren't going
          // to attempt to sign out the user from the current session.

          const ENV = getOwner (this).resolveRegistration ('config:environment');
          signInRoute = signInRoute || getWithDefault (ENV, 'gatekeeper.signInRoute', 'sign-in');

          if (signInAction === 'redirect') {
            // Show the error message, and then redirect to the sign in route.

            this.snackbar.show ({ message: detail });
            this.replaceWith (signInRoute);
          }
          else if (signInAction === 'prompt') {
            // Show the error message, and prompt the user to sign in.

            this.snackbar.show ({ message: detail, action: { label: 'Sign in', click: () => this.replaceWith (signInRoute)}});
          }
          else {
            // Let's just show the error message to the user, but we are not going
            // to take any action at this point in time.

            this.snackbar.show ({ message: detail });
          }
        }
        else {
          // We are just going to reset the gatekeeper client at this point in time
          // It will force the client to reauthenticate itself.

          this.session.gatekeeper.reset ();
        }

        // Let's break out of this for-loop.
        break;
      }
    }

    return true;
  }

  override.async (target.prototype, 'beforeModel', async function (transition) {
    function routeToSignIn (route) {
      const ENV = getOwner (route).resolveRegistration ('config:environment');
      signInRoute = signInRoute || get (ENV, 'gatekeeper.signInRoute');

      if (isNone (signInRoute)) {
        return false;
      }

      // Set the redirect to route so we can come back to this route when the
      // user has signed in.
      const { intent : { url }} = transition;
      const options = { queryParams: { [redirectParamName]: encodeURI (url) } };

      route.replaceWith (signInRoute, options);

      return true;
    }

    function forceSessionReset (route) {
      // Reset the session and then go to the sign in route.
      route.session.reset ();
      routeToSignIn (route);

      route.snackbar.show ({message: 'We had to sign out because your session is no longer valid.', dismiss: true});
    }

    try {
      const isSignedIn = await this._checkSignedIn (transition);

      if (isSignedIn) {
        const authorized = isEmpty (scope) || this.session.accessToken.supports (scope);

        if (!authorized && isPresent (target.actions.unauthorized)) {
          return transition.trigger ('unauthorized', transition);
        }
        else {
          return this._super.call (this, ...arguments);
        }
      }
      else if (!routeToSignIn (this)) {
        return this._super.call (this, ...arguments);
      }
    }
    catch (err) {
      return forceSessionReset (this);
    }
  });
}

export default decorator (authenticated);
