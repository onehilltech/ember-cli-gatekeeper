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

function applyDecorator (target, name, descriptor, options = {}) {
  const { scope } = options;

  /**
   * Check that the current user is authenticated.
   *
   * @param transition
   * @private
   */
  target.prototype._checkSignedIn = function (transition) {
    let isSignedIn = get (this, 'session.isSignedIn');

    if (!isSignedIn) {
      let ENV = getOwner (this).resolveRegistration ('config:environment');
      let signInRoute = getWithDefault (ENV, 'gatekeeper.signInRoute', 'sign-in');

      // Set the redirect to route so we can come back to this route when the
      // user has signed in.
      const queryParams = {redirect: transition.targetName};
      this.replaceWith (signInRoute, {queryParams});
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
    this._super.call (this, ...arguments);

    // Make sure the user is signed into the application.
    this._checkSignedIn (transition);

    let authorized = isEmpty (scope) || this.session.accessToken.supports (scope);
    let controller = this.controllerFor (this.routeName, true);

    if (isPresent (controller)) {
      set (controller, 'isAuthorized', authorized);
    }

    if (!authorized && isPresent (target.prototype.actions.unauthorized)) {
      transition.trigger ('unauthorized', transition);
    }
  });
}

export default function authenticated (target, name, descriptor) {
  if (descriptor) {
    return applyDecorator (target, name, descriptor);
  }
  else {
    let options = target;

    return function (target, name, descriptor) {
      return applyDecorator (target, name, descriptor, options);
    }
  }
}
