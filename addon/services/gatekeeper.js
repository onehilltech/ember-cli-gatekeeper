import Service from '@ember/service';

import { get, getWithDefault, set } from '@ember/object';
import { isPresent, isNone, isEmpty } from '@ember/utils';
import { getOwner } from '@ember/application';
import { resolve, Promise, reject } from 'rsvp';
import { assign } from '@ember/polyfills';
import { KJUR, KEYUTIL } from 'jsrsasign';
import { inject as service } from '@ember/service';

import AccessToken from "../-lib/access-token";
import { DefaultConfigurator } from "../-lib/configurator";
import {tracked} from "@glimmer/tracking";

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
    let ENV = getOwner (this).resolveRegistration ('config:environment');
    let config = get (ENV, 'gatekeeper');

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
  authenticate (opts, force = false) {
    if (this.isAuthenticated && !force) {
      return Promise.resolve ();
    }

    return this._requestClientToken (opts).then (token => {
      this._tokenString = token.access_token;

      // Notify all observers that our token has changed.
      this.notifyPropertyChange ('_tokenString');
    });
  }

  /**
   * Unauthenticate the client on the platform.
   */
  unauthenticate () {
    return this.signOut (this.accessToken.toString());
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
   * Verify a token. If there is no secret or public key, then the token is assumed
   * to be valid.
   *
   * @param token
   */
  verifyToken (token) {
    if (isNone (token)) {
      return resolve (true);
    }

    return new Promise ((resolve, reject) => {
      const { secretOrPublicKey, verifyOptions } = this;

      if (isEmpty (secretOrPublicKey)) {
        return resolve (true);
      }

      const verified = KJUR.jws.JWS.verifyJWT (token, secretOrPublicKey, verifyOptions);
      return verified ? resolve (true) : reject (new Error ('The access token could not be verified.'));
    });
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
      redirectTo = getWithDefault (ENV, 'gatekeeper.startRoute', 'index');
    }

    this.router.replaceWith (redirectTo);
  }

  get redirectTo () {
    let currentURL = this.router.currentURL;
    let [, query] = currentURL.split ('?');

    if (isNone (query)) {
      return null;
    }

    let params = query.split ('&');
    return params.reduce ((accum, param) => {
      let [name, value] = param.split ('=');
      return name === 'redirect' ? decodeURIComponent (value) : accum;
    }, null);
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
    const tokenOptions = this.tokenOptions;
    const data = assign ({grant_type: 'client_credentials'}, tokenOptions, opts);

    const options = {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify (data)
    };

    return fetch (url, options)
      .then ((response) => response.ok ? response.json () : this._handleErrorResponse (response));
  }

  _handleErrorResponse (response) {
    return response.json ().then (reject);
  }
}
