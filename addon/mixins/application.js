import Mixin from '@ember/object/mixin';

import { isEmpty } from '@ember/utils';
import { get, getWithDefault } from '@ember/object';
import { getOwner } from '@ember/application';

const BEARER_ERROR_CODES = [
  'invalid_token',
  'unknown_token',
  'token_disabled',
  'token_expired',
  'unknown_client',
  'client_disabled',
  'unknown_account',
  'account_disabled'
];

/**
 * @mixin Application
 *
 * The application mixin should be added to an application route if the application
 * uses gatekeeper. The mixin will handle authentication errors appropriately.
 */
export default Mixin.create({
  /**
   * Force the application to sign out.
   * @param redirectTo
   * @param errorMessage
   */
  forceSignOut (redirectTo, errorMessage) {
    let ENV = getOwner (this).resolveRegistration ('config:environment');
    let signInRoute = getWithDefault (ENV, 'gatekeeper.signInRoute', 'sign-in');
    let signInController = this.controllerFor (signInRoute);

    signInController.setProperties ({redirectTo, messageToUser: errorMessage});

    // Force the user to sign out.
    let { session } = this.getProperties (['session']);
    session.forceSignOut ();

    this.replaceWith (signInRoute);
  },

  actions: {
    error (reason, transition) {
      let errors = get (reason, 'errors');

      if (isEmpty (errors)) {
        return true;
      }

      for (let i = 0, len = errors.length; i < len; ++ i) {
        let error = errors[i];

        if (error.status === '403' && BEARER_ERROR_CODES.indexOf (error.code) !== -1) {
          this.forceSignOut (transition, error.detail);
          return;
        }
      }

      return true;
    }
  }
});
