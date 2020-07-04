/* global KJUR */

import Service from '@ember/service';
import EmberObject from '@ember/object';

import { isNone } from '@ember/utils';
import { inject as service } from '@ember/service';
import { action } from '@ember/object';
import { alias, bool, not } from '@ember/object/computed';
import { Promise, reject, resolve, all } from 'rsvp';
import { run } from '@ember/runloop';
import { copy } from '@ember/object/internals';

import { KJUR } from 'jsrsasign';

import TokenMetadata from '../-lib/token-metadata';

/*
import fetch from 'fetch';

import {
  isAbortError,
  isServerErrorResponse,
  isUnauthorizedResponse
} from 'ember-fetch/errors';
*/

const TempSession = EmberObject.extend ({
  signOut () {
    const url = this.computeUrl ('/oauth2/logout');
    const accessToken = this.accessToken;

    const options = {
      type: 'POST',
      url,
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    };

    return jQuery.ajax (ajaxOptions);
  },

  computeUrl (relativeUrl) {
    return this.gatekeeper.computeUrl (relativeUrl);
  },
});

/**
 * @class SessionService
 *
 * The service for adding a user session to a resource.
 */
export default class SessionService extends Service {
  @service
  gatekeeper;

  @service ('local-storage')
  storage;

  @service
  store;

  @alias ('storage.gatekeeper_user')
  currentUser;

  @alias ('storage.gatekeeper_user_token')
  accessToken;

  /// The lock screen state for the session.
  @alias ('storage.gatekeeper_lock_screen')
  lockScreen;

  get metadata () {
    if (isNone (this.accessToken.access_token)) {
      return TokenMetadata.create ();
    }

    let parsed = KJUR.jws.JWS.parse (this.accessToken.access_token);
    return TokenMetadata.create (parsed.payloadObj);
  }

  /// Test if the current user is signed in.
  @bool ('accessToken')
  isSignedIn;

  /// Test if the there is no user signed in.
  @not ('isSignedIn')
  isSignedOut;

  /// The current promise refreshing the access token.
  _refreshToken = null;

  get authenticateUrl () {
    return this.gatekeeper.authenticateUrl || this.computeUrl ('/oauth2/token');
  }

  get refreshUrl () {
    return this.gatekeeper.refreshUrl || this.computeUrl ('/oauth2/token');
  }

  /**
   * Force the current user to sign out. This does not communicate the sign out
   * request to the server.
   */
  forceSignOut () {
    this.accessToken = null;
    this.currentUser = null;
    this.lockScreen = false;
  }

  /**
   * Sign in the user.
   *
   * The options provides by the client will be merged with the standard tokenOptions
   * from the gatekeeper configuration.
   *
   * @returns {*}
   */
  signIn (opts) {
    const tokenOptions = Object.assign ({grant_type: 'password'}, opts);

    return this._requestToken (this.authenticateUrl, tokenOptions).then (token => {
      this.accessToken = token;

      // Query the service for the current user. We are going to cache their id
      // just in case the application needs to use it.
      return this.store.queryRecord ('account', {})
        .then (account => {
          this.currentUser = account.toJSON ({includeId: true});
        })
        .catch (reason => {
          this.accessToken = null;
          return reject (reason);
        });
    });
  }

  /**
   * Create a temporary session for the current user.
   *
   * @param payload
   * @param options
   * @returns {*}
   */
  createTempSession (payload, options) {
    const tokenOptions = Object.assign ({grant_type: 'temp'}, {
      payload,
      options,
      access_token: this.accessToken.access_token
    });

    return this._requestToken (this.authenticateUrl, tokenOptions)
      .then (({access_token}) => {
        const gatekeeper = this.gatekeeper;
        const opts = Object.assign ({}, {accessToken: access_token, gatekeeper});

        return TempSession.create (opts);
      });
  }

  /**
   * Open an existing session from an access token.
   *
   * @param accessToken
   */
  openFrom (accessToken) {
    return this.gatekeeper.verifyToken (accessToken)
      .then (() => {
        // Force the current session to sign out.
        this.forceSignOut ();

        // Set the provided access token as the current access token.
        this.accessToken = {access_token: accessToken};

        return this.store.queryRecord ('account', {});
      })
      .then (account => {
        this.currentUser = account.toJSON ({includeId: true});
      });
  }

  /**
   * Sign out of the service.
   *
   * @returns {RSVP.Promise|*}
   */
  @action
  signOut () {
    const url = this.computeUrl ('/oauth2/logout');
    const options = { method: 'POST', headers: this.httpHeaders };

    return fetch (url, options)
      .then ((response) => {
        if (response.ok)
          return response.json ();

        if (xhr.status === 401) {
          // The token is bad. Try to refresh the token, then attempt to sign out the
          // user again in a graceful manner.
          return this.refreshToken ().then (() => {
            return this.signOut ();
          });
        }
        else {
          return reject (xhr);
        }
      })
      .then ((result) => {
        if (result)
          this._completeSignOut ();

        return result;
      });
  }

  /**
   * Authenticate the existing user. This is useful if you need to verify the current
   * user has access to a specific part of the application.
   *
   * @param password
   */
  authenticate (password) {
    const url = this.computeUrl ('/accounts/authenticate');
    const data = { authenticate: { password } };
    const adapter = this.store.adapterFor ('account');

    return adapter.ajax (url, 'POST', { data });
  }

  /**
   * Manually refresh the access token for the current user.
   *
   * @returns {*|RSVP.Promise}
   */
  refreshToken () {
    if (this._refreshToken) {
      return this._refreshToken;
    }

    this._refreshToken = new Promise ((resolve, reject) => {
      const tokenOptions = {
        grant_type: 'refresh_token',
        refresh_token: this.accessToken.refresh_token
      };

      this._requestToken (tokenOptions).then ((token) => {
        // Replace the current user token with this new token, reset the promise
        // variable for next time, and resolve the promise.
        this.accessToken = token;
        this._refreshToken = null;
        resolve ();
      }).catch ((xhr) => {
        // Reset the state of the service. The client, if observing the sign in
        // state of the user, should show the authentication form.
        this.forceSignOut ();

        // Reset the promise variable since we are done refreshing the token, and
        // reject the promise.
        this._refreshToken = null;
        reject (xhr);
      });
    });

    return this._refreshToken;
  }

  get httpHeaders () {
    return { Authorization: `Bearer ${this.accessToken.access_token}` };
  }

  /**
   * Send an authorized AJAX request for the current user. The authorization
   * header will be added to the original request.
   *
   * @param ajaxOptions
   */
  ajax (ajaxOptions) {
    let dupOptions = copy (ajaxOptions, false);

    dupOptions.headers = dupOptions.headers || {};
    dupOptions.headers.Authorization = `Bearer ${this.accessToken.access_token}`;

    return new Promise ((resolve, reject) => {
      jQuery.ajax (dupOptions).then (resolve).catch (xhr => {
        switch (xhr.status) {
          case 401:
            // Use the Gatekeeper service to refresh the token. If the token is refreshed,
            // then retry the original request. Otherwise, pass the original error to the
            // back to the client.
            this.refreshToken ()
              .then (() => this.ajax (dupOptions))
              .catch ((xhr) => run (null, reject, xhr));
            break;

          default:
            run (null, reject, xhr);
        }
      });
    });
  }

  computeUrl (relativeUrl) {
    return this.gatekeeper.computeUrl (relativeUrl);
  }

  /**
   * Private method for requesting an access token from the server.
   *
   * @param url
   * @param opts
   * @private
   */
  _requestToken (url, opts) {
    const tokenOptions = this.get ('gatekeeper.tokenOptions');
    const data = Object.assign ({}, tokenOptions, opts);

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify (data)
    };

    return fetch (url, options)
      .then ((response) => {
        if (response.ok)
          return response.json ();

        if (isUnauthorizedResponse (response)) {
          // handle 401 response
        }
        else if (isServerErrorResponse (response)) {
          // handle 5xx respones
        }
      })
      .then (token => {
        return all ([
          this.gatekeeper.verifyToken (token.access_token),
          this.gatekeeper.verifyToken (token.refresh_token)
        ]).then (() => token);
      });
  }

  /**
   * Complete the sign out process.
   *
   * @private
   */
  _completeSignOut () {
    this.forceSignOut ();
  }
}
