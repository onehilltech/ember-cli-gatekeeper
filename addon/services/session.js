import Service from '@ember/service';
import EmberObject from '@ember/object';

import { isNone, isPresent } from '@ember/utils';
import { inject as service } from '@ember/service';
import { action, computed } from '@ember/object';
import { not } from '@ember/object/computed';
import { Promise, reject, all } from 'rsvp';
import { local } from '@onehilltech/ember-cli-storage';
import { tracked } from "@glimmer/tracking";

import AccessToken from "../-lib/access-token";

/**
 * A temporary session for the current user.
 */
const TempSession = EmberObject.extend ({
  signOut () {
    const url = this.computeUrl ('/oauth2/logout');
    const accessToken = this.accessToken;

    const options = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`
      }
    };

    return fetch (url, options);
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

  @service
  store;

  @local ({name: 'gatekeeper_user', serialize: JSON.stringify, deserialize: JSON.parse})
  currentUser;

  @local ('gatekeeper_user_token')
  _tokenString;

  @local ('gatekeeper_refresh_token')
  _refreshingTokenString;

  @tracked
  _tokenChanged = 0;

  /// The lock screen state for the session.
  @local ({name: 'gatekeeper_lock_screen', deserialize (value) { return value === 'true' }})
  lockScreen;

  _account;

  /// The user account model for the current session.
  get account () {
    if (isPresent (this._account) && this._account.id === this.currentUser.id) {
      return this._account;
    }

    if (isNone (this.currentUser)) {
      return null;
    }

    let data = this.store.normalize ('account', this.currentUser);
    data.data.id = this.currentUser.id;

    this._account = this.store.push (data);
    return this._account;
  }

  @computed ('_tokenChanged')
  get accessToken () {
    return AccessToken.fromString (this._tokenString);
  }

  @computed ('_tokenChanged')
  get refreshToken () {
    return AccessToken.fromString (this._refreshingTokenString);
  }

  /**
   * Test if the current session is signed in.
   *
   * @returns {*}
   */
  get isSignedIn () {
    return this.accessToken.isValid;
  }

  /// Test if the there is no user signed in.
  @not ('isSignedIn')
  isSignedOut;

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
    this.currentUser = null;

    // Reset the properties associated with the access tokens.
    this._resetTokens ();

    this.lockScreen = false;
    this._account = null;
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
      const { access_token, refresh_token } = token;

      // Save the different access tokens, and increment the token change count.
      this._updateTokens (access_token, refresh_token);

      // Query the service for the current user. We are going to cache their id
      // just in case the application needs to use it.
      return this.store.queryRecord ('account', {})
        .then (account => {
          this._account = account;
          this.currentUser = account.toJSON ({includeId: true});
        })
        .catch (reason => {
          // Reset the access tokens, and the counter.
          this._resetTokens ();

          return reject (reason);
        });
    });
  }

  _resetTokens () {
    this._tokenString = null;
    this._refreshingTokenString = null;

    // We still increment the counter since this is a token change.
    this._tokenChanged ++;
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
      access_token: this.accessToken.toString ()
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
        this._updateTokens (accessToken);

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
  signOut (force = false) {
    const url = this.computeUrl ('/oauth2/logout');
    const options = { method: 'POST', headers: this.httpHeaders };

    return fetch (url, options)
      .then ((response) => {
        if (response.ok) {
          return response.json ();
        }

        // The token is bad. Try to refresh the token, then attempt to sign out the
        // user again in a graceful manner.
        return response.status === 401 ?
          this.refresh ().catch ().then (() => this.signOut (true)) :
          force;
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
  refresh () {
    if (isPresent (this._refreshingToken)) {
      return this._refreshingToken;
    }

    this._refreshingToken = new Promise ((resolve, reject) => {
      const tokenOptions = {
        grant_type: 'refresh_token',
        refresh_token: this.refreshToken.toString ()
      };

      this._requestToken (tokenOptions)
        .then (response => {
          if (response.ok) {
            return response.json ();
          }

          // Force the current user to sign out of the application.
          this._resetTokens ();
          return response.json ().then (reject);
        })
        .then (token => {
          const { access_token, refresh_token } = token;

          // Update the access tokens, and clear the refreshing token promise.
          this._updateTokens (access_token, refresh_token);
          this._refreshingToken = null;
        })
        .then (resolve);
    });

    return this._refreshingToken;
  }

  get httpHeaders () {
    return { Authorization: `Bearer ${this.accessToken.toString ()}` };
  }

  computeUrl (relativeUrl) {
    return this.gatekeeper.computeUrl (relativeUrl);
  }

  _updateTokens (accessToken, refreshToken) {
    this._tokenString = accessToken;
    this._refreshingTokenString = refreshToken;

    this._tokenChanged ++;
  }

  /**
   * Private method for requesting an access token from the server.
   *
   * @param url
   * @param opts
   * @private
   */
  _requestToken (url, opts) {
    const tokenOptions = this.gatekeeper.tokenOptions;
    const data = Object.assign ({}, tokenOptions, opts);

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify (data)
    };

    return fetch (url, options)
      .then ((response) => response.ok ? response.json () : this._handleErrorResponse (response))
      .then (token => {
        return all ([
          this.gatekeeper.verifyToken (token.access_token),
          this.gatekeeper.verifyToken (token.refresh_token)
        ]).then (() => token);
      });
  }

  _handleErrorResponse (response) {
    return response.json ().then (reject);
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
