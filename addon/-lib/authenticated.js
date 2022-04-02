import { get, getWithDefault, set } from '@ember/object';
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
    verifyOptions
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

  override.async (target.prototype, 'beforeModel', async function (transition) {
    function routeToSignIn (route) {
      let ENV = getOwner (route).resolveRegistration ('config:environment');
      let signInRoute = get (ENV, 'gatekeeper.signInRoute');

      if (isNone (signInRoute)) {
        return false;
      }

      // Set the redirect to route so we can come back to this route when the
      // user has signed in.
      const { intent : { url }} = transition;

      let options = { queryParams: { [redirectParamName]: encodeURI (url) } };
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

        if (!authorized && isPresent (target.prototype.actions.unauthorized)) {
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
