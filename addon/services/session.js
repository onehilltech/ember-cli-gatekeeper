import Service from '@ember/service';

import { isNone, isPresent, isEmpty } from '@ember/utils';
import { inject as service } from '@ember/service';
import { action, computed, get, set } from '@ember/object';
import { Promise } from 'rsvp';
import { A } from '@ember/array';
import { omit } from 'lodash';

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
    const key = this.storageKey ('gatekeeper_user');
    return get (this.gatekeeper, key);
  }

  set currentUser (value) {
    const key = this.storageKey ('gatekeeper_user');
    return set (this.gatekeeper, key, omit (value, ['password']));
  }

  get userId () {
    return this.currentUser.id;
  }

  get _tokenString () {
    const key = this.storageKey ('gatekeeper_ut');
    return get (this.gatekeeper, key);
  }

  set _tokenString (value) {
    const key = this.storageKey ('gatekeeper_ut');
    return set (this.gatekeeper, key, value);
  }

  get _refreshingTokenString () {
    const key = this.storageKey ('gatekeeper_rt');
    return get (this.gatekeeper, key);
  }

  set _refreshingTokenString (value) {
    let key = this.storageKey ('gatekeeper_rt');
    return set (this.gatekeeper, key, value);
  }

  /**
   * Get the account object for the current user from the server.
   */
  async me () {
    const account = await this.store.findRecord ('account', this.currentUser.id);

    if (isPresent (account)) {
      // Let's use this time to replace the old account with the most resent one
      // we have downloaded from the server.
      this.currentUser = account.serialize ();
    }

    return account;
  }

  /**
   * Get the account model for the current user.
   */
  get account () {
    const currentUser = this.currentUser;

    if (isNone (currentUser) || isEmpty (currentUser.id)) {
      return null;
    }

    const account = this.store.peekRecord ('account', currentUser.id);

    if (isPresent (account)) {
      return account;
    }

    // There is no account model for this user. Let's create one and return it to
    // the caller.

    const data = this.store.normalize ('account', currentUser);
    data.data.id = this.currentUser.id;
    return this.store.push (data);
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
  async signIn (opts) {
    const tokenOptions = Object.assign ({ grant_type: 'password' }, opts);
    const { access_token, refresh_token } = await this.gatekeeper._requestToken (this.authenticateUrl, tokenOptions);


    // Save the different access tokens, and increment the token change count.
    this._updateTokens (access_token, refresh_token);
    await this._completeSignIn ();
  }

  /**
   * Complete the sign in process.
   *
   * @returns {*}
   * @private
   */
  async _completeSignIn () {
    try {
      // Query the service for the current user. We are going to cache their id
      // just in case the application needs to use it.
      const account = await this.store.queryRecord ('account', {})
      this.currentUser = account.serialize ();

      // Notify all listeners.
      this.listeners.forEach (listener => listener.didSignIn (this, this.currentUser));
    }
    catch (err) {
      // Reset the access tokens, and the counter.
      this._resetTokens ();

      throw err;
    }
  }

  /**
   * Sign out of the service.
   *
   * @returns {RSVP.Promise|*}
   */
  @action
  async signOut (force = false) {
    // Let all listeners know we are signing out the current user. After the listeners
    // are complete, we can sign out the current user. After the sign out is complete,
    // we need to clean everything up.

    await Promise.all (this.listeners.map (listener => listener.willSignOut ()));

    try {
      const result = await this.gatekeeper.signOut (this.accessToken.toString ());

      if (result) {
        this.reset ();
      }

      return result;
    }
    catch (reason) {
      if (isPresent (reason.errors)) {
        let [error] = reason.errors;

        if (force || (error.status === '403' || error.status === '401')) {
          this.reset ();
          return true;
        }
      }
      else {
        return Promise.reject (reason);
      }
    }
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
  async createTempSession (payload, options) {
    const tokenOptions = Object.assign ({},{
      payload,
      options,
      access_token: this.accessToken.toString ()
    }, { grant_type: 'temp' });

    const { access_token } = await this.gatekeeper._requestToken (this.authenticateUrl, tokenOptions);
    return TempSession.create ({ accessToken: access_token, gatekeeper: this.gatekeeper });
  }

  /**
   * Open an existing session from an access token.
   *
   * @param accessToken
   * @param opts
   */
  async openFrom (accessToken, opts = {}) {
    const {
      verified = noOp,
      skipAccountLookup = false,
      secretOrPublicKey,
      verifyOptions,
      verifyRemoteAsFallback = false,
    } = opts;

    const result = await this.gatekeeper.verifyToken (accessToken, secretOrPublicKey, verifyOptions, verifyRemoteAsFallback);

    if (!result) {
      throw new Error ('We could not verify the access token');
    }

    await verified (AccessToken.fromString (accessToken));

    // Force the current session to sign out.
    this.reset ();

    // Set the provided access token as the current access token.
    this._updateTokens (accessToken);

    if (!skipAccountLookup) {
      await this._completeSignIn ();
    }
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

      this.gatekeeper._requestToken (this.authenticateUrl, tokenOptions)
        .then (response => {
          const { access_token, refresh_token } = response;

          // Update the access tokens, and clear the refreshing token promise.
          this._updateTokens (access_token, refresh_token);
        })
        .then (resolve).catch (reject)
        .finally (() => {
          this._refreshingToken = undefined;
        });
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
