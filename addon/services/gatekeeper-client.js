/* global KJUR,KEYUTIL */
import Ember from 'ember';

export default Ember.Service.extend({
  /// Reference to local storage.
  storage: Ember.inject.service ('local-storage'),

  _accessToken: Ember.computed.alias ('storage.gatekeeper_client_token'),

  accessToken: Ember.computed.readOnly ('_accessToken'),

  init () {
    this._super (...arguments);

    let ENV = Ember.getOwner (this).resolveRegistration ('config:environment');
    this.setProperties (Ember.copy (Ember.get (ENV, 'gatekeeper')));
  },

  isUnauthenticated: Ember.computed.none ('_accessToken'),
  isAuthenticated: Ember.computed.not ('isUnauthenticated'),

  versionUrl: Ember.computed ('{baseUrl,version}', function () {
    const baseUrl = this.get ('baseUrl');
    const version = this.getWithDefault ('version', 1);

    return `${baseUrl}/v${version}`
  }),

  computeUrl (relativeUrl) {
    return `${this.get ('versionUrl')}${relativeUrl}`;
  },

  /**
   * Authenticate the client.
   *
   * @param opts
   */
  authenticate (opts) {
    return this._requestToken (opts).then ((token) => {
      this.set ('_accessToken', token);
    });
  },

  /**
   * Reset the state of the service.
   */
  reset () {
    this.set ('_accessToken');
  },

  /**
   * Private method for requesting an access token from the server.
   *
   * @param opts
   * @returns {RSVP.Promise}
   * @private
   */
  _requestToken (opts) {
    const url = this.computeUrl ('/oauth2/token');
    const tokenOptions = this.get ('tokenOptions');
    const data = Ember.assign ({grant_type: 'client_credentials'}, tokenOptions, opts);

    const ajaxOptions = {
      method: 'POST',
      url: url,
      cache: false,
      dataType: 'json',
      contentType: 'application/json',
      data: JSON.stringify (data)
    };

    return Ember.$.ajax (ajaxOptions);
  },

  publicKey: Ember.computed ('publicCert', function () {
    const publicCert = this.get ('publicCert');
    return Ember.isPresent (publicCert) ? KEYUTIL.getKey (publicCert) : null;
  }),

  secretOrPublicKey: Ember.computed ('{secret,publicKey}', function () {
    let secret = this.get ('secret');
    return Ember.isPresent (secret) ? secret : this.get ('publicKey');
  }),

  /**
   * Verify a token. If there is no secret or public key, then the token is assumed
   * to be valid.
   *
   * @param token
   */
  verifyToken (token) {
    if (Ember.isNone (token)) {
      return Ember.RSVP.resolve ({});
    }

    return new Ember.RSVP.Promise ((resolve, reject) => {
      const {
        secretOrPublicKey,
        verifyOptions
      } = this.getProperties (['secretOrPublicKey','verifyOptions']);

      if (Ember.isNone (secretOrPublicKey)) {
        return resolve (true);
      }

      const isValid = KJUR.jws.JWS.verifyJWT (token, secretOrPublicKey, verifyOptions);
      return isValid ? resolve (true) : reject (new Error ('Failed to verify token.'));
    });
  },
});
