import Service from '@ember/service';

import { inject as service } from '@ember/service';
import { get } from '@ember/object';
import { alias, bool, not } from '@ember/object/computed';
import { isPresent, isNone, isEmpty } from '@ember/utils';
import { getOwner } from '@ember/application';
import { resolve, Promise, reject } from 'rsvp';
import { assign } from '@ember/polyfills';
import { KJUR, KEYUTIL } from 'jsrsasign';

export default class GatekeeperService extends Service {
  constructor () {
    super (...arguments);

    let ENV = getOwner (this).resolveRegistration ('config:environment');
    this._config = get (ENV, 'gatekeeper');
  }

  @service ('local-storage')
  storage;

  @alias ('storage.gatekeeper_client_token')
  accessToken;

  @bool ('accessToken')
  isAuthenticated;

  @not ('isAuthenticated')
  isUnauthenticated;

  get baseUrl () {
    return this._config.baseUrl;
  }

  get tokenOptions () {
    return this._config.tokenOptions;
  }

  computeUrl (relativeUrl) {
    return `${this.baseUrl}${relativeUrl}`;
  }

  /**
   * Authenticate the client.
   *
   * @param opts
   */
  authenticate (opts) {
    return this._requestClientToken (opts).then ((token) => this.accessToken = token);
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
            Authorization: `Bearer ${this.accessToken.access_token}`
          },
          body: JSON.stringify ({email})
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
    return isPresent (this._config.publicCert) ? KEYUTIL.getKey (this._config.publicCert) : null;
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
      return verified ? resolve (true) : reject (new Error ('Failed to verify token.'));
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
