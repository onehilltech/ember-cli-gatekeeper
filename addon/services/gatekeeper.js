import Service from '@ember/service';

import { get, set } from '@ember/object';
import { isPresent, isNone } from '@ember/utils';
import { getOwner } from '@ember/application';
import { Promise, reject } from 'rsvp';
import { KJUR, KEYUTIL } from 'jsrsasign';
import { inject as service } from '@ember/service';

import AccessToken from "../-lib/access-token";
import TempSession from '../-lib/temp-session';

import { DefaultConfigurator } from "../-lib/configurator";
import { tracked } from "@glimmer/tracking";

import { assert } from '@ember/debug';

function noOp () {}

/**
 * @class GatekeeperService
 *
 * The service for the gatekeeper framework.
 */
export default class GatekeeperService extends Service {
  constructor () {
    super (...arguments);

    this.configurator = this.defaultConfigurator;
  }

  @service
  router;

  @service
  storage;

  @tracked
  configurator;

  /**
   * Create a new instance of a DefaultConfigurator for the service.
   *
   * @returns {DefaultConfigurator}
   */
  get defaultConfigurator () {
    const ENV = getOwner (this).resolveRegistration ('config:environment');
    const config = ENV.gatekeeper || {};

    return new DefaultConfigurator (config);
  }

  get storageLocation () {
    return this.configurator.storageLocation;
  }

  storageKey (key) {
    return `storage.${this.storageLocation}.${key}`;
  }

  get _tokenString () {
    return get (this, this.storageKey ('gatekeeper_ct'));
  }

  set _tokenString (value) {
    return set (this, this.storageKey ('gatekeeper_ct'), value);
  }

  /// The singleton access token for the gatekeeper.
  get accessToken () {
    return AccessToken.fromString (this._tokenString);
  }

  /**
   * Test if the client has been authenticated.
   *
   * @returns {boolean}
   */
  get isAuthenticated () {
    return this.accessToken.isValid && !this.accessToken.isExpired;
  }

  get isUnauthenticated () {
    return !this.isAuthenticated;
  }

  get baseUrl () {
    return this.configurator.baseUrl;
  }

  get tokenOptions () {
    return this.configurator.tokenOptions;
  }

  get authenticateUrl () {
    return this.configurator.authenticateUrl;
  }

  computeUrl (relativeUrl) {
    return `${this.baseUrl}${relativeUrl}`;
  }

  /**
   * Authenticate the client.
   *
   * @param opts
   * @param force
   */
  async authenticate (opts, force = false) {
    if (this.isAuthenticated && !force) {
      return;
    }

    const token = await this._requestClientToken (opts);
    this._tokenString = token.access_token;

    // Notify all observers that our token has changed.
    this.notifyPropertyChange ('_tokenString');
  }

  /**
   * Authenticate the client using the provided token.
   *
   * @param token
   * @param opts
   * @return {RSVP.Promise<void>}
   */
  async authenticateFrom (token, opts = {}) {
    const {
      verified = noOp,
      secretOrPublicKey,
      verifyOptions,
      verifyRemoteAsFallback = false,
      force = false,
    } = opts;

    if (this.isAuthenticated && !force) {
      return;
    }

    const result = await this.verifyToken (token, secretOrPublicKey, verifyOptions, verifyRemoteAsFallback);

    if (!result) {
      throw new Error ('We could not verify the access token');
    }

    // Let's unauthenticate the current client so we can replace the previous client
    // token when the new client token.
    await this.unauthenticate ();

    const accessToken = AccessToken.fromString (token);
    await verified (accessToken);

    // Replace the old token with this new token.
    this._tokenString = token;

    // Notify all observers that our token has changed.
    this.notifyPropertyChange ('_tokenString');
  }

  /**
   * Unauthenticate the client on the platform.
   */
  async unauthenticate () {
    const accessToken = this.accessToken.toString ();

    await this.signOut (accessToken);
    this.reset ();
  }

  /**
   * Reset the client.
   */
  reset () {
    this._tokenString = null;
  }

  /**
   * Sign out a token on the system.
   */
  signOut (token) {
    const url = this.computeUrl ('/oauth2/logout');

    const options = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`
      }
    };

    return fetch (url, options).then ((response) => {
      if (response.ok) {
        return response.json ();
      }
      else {
        return response.json ().then (result => Promise.reject (result));
      }
    });
  }

  /**
   * Initiate the forgot password process.
   */
  forgotPassword (email, opts) {
    return this.authenticate (opts)
      .then (() => {
        let url = this.computeUrl ('/password/forgot');

        let opts = {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${this.accessToken.toString ()}`
          },
          body: JSON.stringify ({ email })
        };

        return fetch (url, opts);
      })
      .then (response => response.ok ? response.json () : this._handleErrorResponse (response));
  }

  /**
   * Reset the password for the user.
   */
  resetPassword (token, password) {
    let url = this.computeUrl ('/password/reset');

    let options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify ({'reset-password': {token, password}})
    };

    return fetch (url, options).then (response => response.ok ? response.json () : this._handleErrorResponse (response));
  }

  get publicKey () {
    const { publicCert } = this.configurator;

    return isPresent (publicCert) ? KEYUTIL.getKey (publicCert) : null;
  }

  get secretOrPublicKey () {
    return this.configurator.secretOrPublicKey;
  }

  get verifyOptions () {
    return this.configurator.verifyOptions;
  }

  /**
   * Create a temporary session for the current client.
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

    const url = this.computeUrl ('/oauth2/token');

    return this._requestToken (url, tokenOptions)
      .then (res => Object.assign ({}, { accessToken: res.access_token, gatekeeper: this}))
      .then (opts => TempSession.create (opts));
  }


  /**
   * Verify a token. If there is no secret or public key, then the token is assumed
   * to be valid.
   *
   * @param token
   * @param secretOrPublicKey
   * @param verifyOptions
   * @param verifyRemoteAsFallback
   */
  async verifyToken (token, secretOrPublicKey, verifyOptions, verifyRemoteAsFallback = false) {
    assert ('You must provide a token to verify.', isPresent (token));

    secretOrPublicKey = secretOrPublicKey || this.secretOrPublicKey;
    verifyOptions = verifyOptions || this.verifyOptions;

    // We can only verify a token if we have a secret or public key. Otherwise, we
    // cannot verify the access token.
    let verified = false;

    if (isPresent (secretOrPublicKey)) {
      verified = KJUR.jws.JWS.verifyJWT (token, secretOrPublicKey, verifyOptions);
    }

    if (verified)
      return verified;

    if (verifyRemoteAsFallback) {
      const result = await this.verifyTokenRemotely (token, verifyOptions);
      verified = result.verified;
    }

    return verified;
  }

  /**
   * Verify an access token remotely with the server.
   *
   * @param token
   * @param options
   * @return {any}
   */
  async verifyTokenRemotely (token, options) {
    const data = { token, options };
    const url = this.computeUrl ('/oauth2/verify');

    const request = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify (data)
    };

    const response = await fetch (url, request);
    const res = await response.json ();

    if (response.ok) {
      return res;
    }

    throw res;
  }

  /**
   * Perform the redirect to for the user. This will either take the user to the original
   * page they accessed before being redirected to the sign-in page, or the start route
   * if no redirect is present.
   */
  redirect (redirectTo = this.redirectTo) {
    if (isNone (redirectTo)) {
      // There is no redirect url. So, we either transition to the default route, or we
      // transition to the index.
      let ENV = getOwner (this).resolveRegistration ('config:environment');
      redirectTo = get (ENV, 'gatekeeper.startRoute') || 'index';
    }

    this.router.replaceWith (redirectTo);
  }

  /**
   * Get the default redirect to property.
   *
   * @returns {null|*}
   */
  get redirectTo () {
    let currentURL = this.router.currentURL;
    let [, query] = currentURL.split ('?');

    if (isNone (query)) {
      return null;
    }

    const redirectParam = query.split ('&').find (param => param.split ('=')[0] === 'redirect');
    return isPresent (redirectParam) ? decodeURIComponent (redirectParam.split ('=')[1]) : undefined;
  }

  /**
   * Requesting an access token from the server.
   *
   * @param opts
   * @returns {RSVP.Promise}
   * @private
   */
  _requestClientToken (opts) {
    const url = this.computeUrl ('/oauth2/token');
    const options = Object.assign ({}, opts, { grant_type: 'client_credentials' });

    return this._requestToken (url, options);
  }

  _handleErrorResponse (response) {
    return response.json ().then (reject);
  }

  /**
   * Request an access token from the server.
   *
   * @param url
   * @param opts
   */
  async _requestToken (url, opts) {
    const data = Object.assign ({}, this.tokenOptions, opts);

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify (data)
    };

    const response = await fetch (url, options);
    const res = await response.json ();

    if (response.ok) {
      return res;
    }
    else {
      throw res;
    }
  }
}
