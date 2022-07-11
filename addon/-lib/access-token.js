import { alias } from '@ember/object/computed';
import { isPresent, isEmpty } from '@ember/utils';
import { A } from '@ember/array';
import { some } from 'lodash';
import { KJUR } from 'jsrsasign';

export default class AccessToken {
  constructor (string, options) {
    this._string = string;
    Object.assign (this, options);
  }

  static _EMPTY = null;

  static get EMPTY () {
    if (isPresent (this._EMPTY)) {
      return this._EMPTY;
    }

    this._EMPTY = Object.freeze (new AccessToken ());
    return this._EMPTY;
  }

  /**
   * Create an access token object from an access token string.
   *
   * @param str
   * @returns {AccessToken}
   */
  static fromString (str) {
    /// If there is no string, then we need to return an empty token.
    if (isEmpty (str)) {
      return AccessToken.EMPTY;
    }

    let parsed = KJUR.jws.JWS.parse (str);
    return Object.freeze (new AccessToken (str, parsed.payloadObj));
  }

  /// Convert the access token to a string.
  toString () {
    return this._string;
  }

  get isValid () {
    return isPresent (this._string);
  }

  aud;

  @alias ('aud')
  audience;

  sub;

  @alias ('sub')
  subject;

  iss;

  @alias ('iss')
  issuer;

  /// The time the
  iat;

  get issuedAt () {
    return isPresent (this.iat) ? new Date (this.iat * 1000) : null;
  }

  exp;

  /// The scope associated with the access token.
  scope;

  get hasExpiration () {
    return isPresent (this.exp);
  }

  get expiresAt () {
    return this.hasExpiration ? new Date (this.exp * 1000) : null;
  }

  get isExpired () {
    return this.hasExpiration ? (this.exp <= Date.now () / 1000) : false;
  }

  /**
   * Test if the token supports the specified scope.
   *
   * @param scope
   * @return {Boolean}
   */
  supports (scope) {
    return some (this.regexps, regexp => regexp.test (scope));
  }

  /**
   * Evaluate if the metadata has a capability.
   *
   * @param capability
   */
  hasCapability (capability) {
    return this.supports (capability);
  }

  get regexps () {
    return isPresent (this.scope) ? this.scope.map (s => new RegExp (s)) : A ();
  }
}
