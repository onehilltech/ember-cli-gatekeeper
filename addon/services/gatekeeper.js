import Service from '@ember/service';

import { get, computed } from '@ember/object';
import { not } from '@ember/object/computed';
import { isPresent, isNone, isEmpty } from '@ember/utils';
import { getOwner } from '@ember/application';
import { resolve, Promise, reject } from 'rsvp';
import { assign } from '@ember/polyfills';
import { KJUR, KEYUTIL } from 'jsrsasign';
import { local } from '@onehilltech/ember-cli-storage';

import AccessToken from "../-lib/access-token";

export default class GatekeeperService extends Service {
  constructor () {
    super (...arguments);

    let ENV = getOwner (this).resolveRegistration ('config:environment');
    this._config = get (ENV, 'gatekeeper');
  }

  /// The access token stored in local storage.
  @local('gatekeeper_ct')
  _tokenString;

  /// The singleton access token for the gatekeeper.
  @computed ('_tokenString')
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

  @not ('isAuthenticated')
  isUnauthenticated;

  get baseUrl () {
    return this._config.baseUrl;
  }

  get tokenOptions () {
    return this._config.tokenOptions;
  }

  get authenticateUrl () {
    return this._config.authenticateUrl;
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
    const { publicCert } = this._config;

    return isPresent (publicCert) ? KEYUTIL.getKey (publicCert) : null;
  }

  get secretOrPublicKey () {
    return this._config.secret || this._config.publicKey;
  }

  get verifyOptions () {
    return this._config.verifyOptions;
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
      const {
        secretOrPublicKey,
        verifyOptions
      } = this;

      if (isEmpty (secretOrPublicKey)) {
        return resolve (true);
      }

      const verified = KJUR.jws.JWS.verifyJWT (token, secretOrPublicKey, verifyOptions);
      return verified ? resolve (true) : reject (new Error ('The access token could not be verified.'));
    });
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
