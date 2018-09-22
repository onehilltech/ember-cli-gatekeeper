import Service from '@ember/service';

import { inject as service } from '@ember/service';
import { computed, get } from '@ember/object';
import { alias, bool, not } from '@ember/object/computed';
import { isPresent, isNone, isEmpty } from '@ember/utils';
import { getOwner } from '@ember/application';
import { copy } from 'ember-copy';
import { resolve, Promise } from 'rsvp'
import { assign } from '@ember/polyfills'

import $ from 'jquery';

export default Service.extend({
  /// Reference to local storage.
  storage: service ('local-storage'),

  accessToken: alias ('storage.gatekeeper_client_token'),

  init () {
    this._super (...arguments);

    let ENV = getOwner (this).resolveRegistration ('config:environment');
    this.setProperties (copy (get (ENV, 'gatekeeper'), true));
  },

  isAuthenticated: bool ('accessToken'),
  isUnauthenticated: not ('isAuthenticated'),

  computeUrl (relativeUrl) {
    return `${this.get ('baseUrl')}${relativeUrl}`;
  },

  /**
   * Authenticate the client.
   *
   * @param opts
   */
  authenticate (opts) {
    return this._requestToken (opts).then ((token) => {
      this.set ('accessToken', token);
    });
  },

  /**
   * Reset the state of the service.
   */
  reset () {
    this.set ('accessToken');
  },

  publicKey: computed ('publicCert', function () {
    const publicCert = this.get ('publicCert');
    return isPresent (publicCert) ? KEYUTIL.getKey (publicCert) : null;
  }),

  secretOrPublicKey: computed ('{secret,publicKey}', function () {
    let secret = this.get ('secret');
    return isPresent (secret) ? secret : this.get ('publicKey');
  }),

  /**
   * Verify a token. If there is no secret or public key, then the token is assumed
   * to be valid.
   *
   * @param token
   */
  verifyToken (token) {
    if (isNone (token)) {
      return resolve ({});
    }

    return new Promise ((resolve, reject) => {
      const {
        secretOrPublicKey,
        verifyOptions
      } = this.getProperties (['secretOrPublicKey','verifyOptions']);

      if (isEmpty (secretOrPublicKey)) {
        return resolve (true);
      }

      const isValid = KJUR.jws.JWS.verifyJWT (token, secretOrPublicKey, verifyOptions);
      return isValid ? resolve (true) : reject (new Error ('Failed to verify token.'));
    });
  },

  /**
   * Requesting an access token from the server.
   *
   * @param opts
   * @returns {RSVP.Promise}
   * @private
   */
  _requestToken (opts) {
    const url = this.computeUrl ('/oauth2/token');
    const tokenOptions = this.get ('tokenOptions');
    const data = assign ({grant_type: 'client_credentials'}, tokenOptions, opts);

    const ajaxOptions = {
      method: 'POST',
      url: url,
      cache: false,
      dataType: 'json',
      contentType: 'application/json',
      data: JSON.stringify (data)
    };

    return $.ajax (ajaxOptions);
  },
});
