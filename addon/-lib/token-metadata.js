import EmberObject from '@ember/object';

import { computed } from '@ember/object';
import { alias, bool } from '@ember/object/computed';
import { isPresent } from '@ember/utils';
import { A } from '@ember/array';
import { some } from 'lodash-es';

export default EmberObject.extend ({
  audience: alias ('aud'),

  subject: alias ('sub'),

  issuer: alias ('iss'),

  issuedAt: computed ('iat', function () {
    const iat = this.iat;
    return isPresent (iat) ? new Date (iat * 1000) : null;
  }),

  expiresAt: computed ('exp', function () {
    const exp = this.exp;
    return isPresent (exp) ? new Date (exp * 1000) : null;
  }),

  isExpired: computed ('exp', function () {
    const exp = this.exp;
    return isPresent (exp) ? (exp <= Date.now () / 1000) : false;
  }),

  /// Test if the token has an expiration date.
  hasExpiration: bool ('exp'),

  /**
   * Test if the token supports the specified scope.
   *
   * @param scope
   * @return {Boolean}
   */
  supports (scope) {
    let regexps = this._regexps;
    return some (regexps, regexp => regexp.test (scope));
  },

  /**
   * Evaluate if the metadata has a capability.
   *
   * @param capability
   */
  hasCapability (capability) {
    return this.supports (capability);
  },

  _regexps: computed ('scope.[]', function ()  {
    let scope = this.scope;
    return isPresent (scope) ? scope.map (s => new RegExp (s)) : A ();
  })
});
