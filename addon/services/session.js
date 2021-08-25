import Service from '@ember/service';

import { isNone, isPresent, isEmpty } from '@ember/utils';
import { inject as service } from '@ember/service';
import { action, computed, get, set } from '@ember/object';
import { Promise, reject, all } from 'rsvp';
import { A } from '@ember/array';
import { omit } from 'lodash-es';

import AccessToken from "../-lib/access-token";
import TempSession from '../-lib/temp-session';

function noOp () {}

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

  storageKey (key) {
    return this.gatekeeper.storageKey (key);
  }

  get currentUser () {
    let key = this.storageKey ('gatekeeper_user');
    return get (this.gatekeeper, key);
  }

  set currentUser (value) {
    let key = this.storageKey ('gatekeeper_user');
    return set (this.gatekeeper, key, omit (value, ['password']));
  }

  get userId () {
    return this.currentUser.id;
  }

  get _tokenString () {
    let key = this.storageKey ('gatekeeper_ut');
    return get (this.gatekeeper, key);
  }

  set _tokenString (value) {
    let key = this.storageKey ('gatekeeper_ut');
    return set (this.gatekeeper, key, value);
  }

  get _refreshingTokenString () {
    let key = this.storageKey ('gatekeeper_rt');
    return get (this.gatekeeper, key);
  }

  set _refreshingTokenString (value) {
    let key = this.storageKey ('gatekeeper_rt');
    return set (this.gatekeeper, key, value);
  }

  /// The lock screen state for the session.
  set lockScreen (value) {
    let key = this.storageKey ('gatekeeper_lock_screen');
    return set (this.gatekeeper, key, value);
  }

  get lockScreen () {
    let key = this.storageKey ('gatekeeper_lock_screen');
    return get (this.gatekeeper, key) === 'true';
  }

  /// The user account model for the current session.
  get account () {
    let currentUser = this.currentUser;

    if (isNone (currentUser)) {
      return null;
    }

    let account = this.store.peekRecord ('account', currentUser.id);

    if (isPresent (account)) {
      return account;
    }

    // There is no account model for this user. Let's create one and return it to
    // the caller.

    let data = this.store.normalize ('account', currentUser);
    data.data.id = this.currentUser.id;
    account = this.store.push (data);

    return account;
  }

  @computed ('_tokenString')
  get accessToken () {
    return AccessToken.fromString (this._tokenString);
  }

  @computed ('_refreshingTokenString')
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
  get isSignedOut () {
    return !this.isSignedIn;
  }

  get authenticateUrl () {
    return this.gatekeeper.authenticateUrl || this.computeUrl ('/oauth2/token');
  }

  get refreshUrl () {
    return this.gatekeeper.refreshUrl || this.computeUrl ('/oauth2/token');
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
      return this._completeSignIn ();
    });
  }

  /**
   * Complete the sign in process.
   *
   * @returns {*}
   * @private
   */
  _completeSignIn () {
    // Query the service for the current user. We are going to cache their id
    // just in case the application needs to use it.
    return this.store.queryRecord ('account', {})
      .then (account => {
        this.currentUser = account.toJSON ({includeId: true});

        // Notify all listeners.
        this.listeners.forEach (listener => listener.didSignIn (this, this.currentUser));
      })
      .catch (reason => {
        // Reset the access tokens, and the counter.
        this._resetTokens ();

        return reject (reason);
      });
  }

  /**
   * Sign out of the service.
   *
   * @returns {RSVP.Promise|*}
   */
  @action
  signOut (force = false) {
    // Let all listeners know we are signing out the current user. After the listeners
    // are complete, we can sign out the current user. After the sign out is complete,
    // we need to clean everything up.

    return Promise.all (this.listeners.map (listener => listener.willSignOut ()))
      .then (() => this.gatekeeper.signOut (this.accessToken.toString ()))
      .then (result => {
        if (result) {
          this.reset ();
        }

        return result;
      })
      .catch (reason => {
        if (isPresent (reason.errors)) {
          let [error] = reason.errors;

          if (force || (error.status === '403' || error.status === '401')) {
            this.reset ();
            return true;
          }
        } else {
          // Force the rejection to continue upstream.
          return Promise.reject (reason);
        }
      });
  }

  /**
   * Force the current user to sign out. This does not communicate the sign out
   * request to the server.
   */
  reset () {
    // Reset the properties associated with the access tokens.
    this._resetTokens ();

    this.currentUser = null;
    this.notifyPropertyChange ('currentUser');

    // Reset the lock screen.
    this.lockScreen = false;
  }

  _resetTokens () {
    this._updateTokens (null, null);
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
   * @param opts
   */
  openFrom (accessToken, opts = {}) {
    const { verified = noOp, skipAccountLookup = false } = opts;

    return this.gatekeeper.verifyToken (accessToken)
      .then (() => verified (AccessToken.fromString (accessToken)))
      .then (() => {
        // Force the current session to sign out.
        this.reset ();

        // Set the provided access token as the current access token.
        this._updateTokens (accessToken);

        if (!skipAccountLookup) {
          return this._completeSignIn ();
        }
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

      this._requestToken (this.authenticateUrl, tokenOptions)
        .then (response => {
          const { access_token, refresh_token } = response;

          // Update the access tokens, and clear the refreshing token promise.
          this._updateTokens (access_token, refresh_token);
          this._refreshingToken = null;
        })
        .then (resolve).catch (reject);
    });

    return this._refreshingToken;
  }

  get httpHeaders () {
    return { Authorization: `Bearer ${this.accessToken.toString ()}` };
  }

  computeUrl (relativeUrl) {
    return this.gatekeeper.computeUrl (relativeUrl);
  }

  protectUrl (url, baseUrl) {
    if (isEmpty (url) || (isPresent (baseUrl) && !url.startsWith (baseUrl))) {
      return url;
    }

    let accessToken = this.isSignedIn ? this.accessToken : this.gatekeeper.accessToken;
    return `${url}?access_token=${accessToken.toString ()}`;
  }

  _updateTokens (accessToken, refreshToken) {
    this._tokenString = accessToken;
    this._refreshingTokenString = refreshToken;

    this.notifyPropertyChange ('_tokenString');
    this.notifyPropertyChange ('_refreshingTokenString');
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
      .then (response => {
        return response.json ().then (res => {
          if (response.ok) {
            return all ([
              this.gatekeeper.verifyToken (res.access_token),
              this.gatekeeper.verifyToken (res.refresh_token)
            ]).then (() => res);
          }
          else {
            return Promise.reject (res);
          }
        });
      });
  }

  /// Listener objects for the session.
  _listeners;

  get listeners () {
    return this._listeners || [];
  }

  addListener (listener) {
    if (isNone (this._listeners)) {
      this._listeners = A ();
    }

    this._listeners.pushObject (listener);
  }

  removeListener (listener) {
    if (isPresent (this._listeners)) {
      this._listeners.removeObject (listener);
    }
  }
}
