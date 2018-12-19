import { alias, bool } from '@ember/object/computed';
import { isPresent } from '@ember/utils';
import micromatch from "npm:micromatch";
import EmberObject, { computed } from '@ember/object';

export default EmberObject.extend ({
  audience: alias ('aud'),
  subject: alias ('sub'),
  issuer: alias ('iss'),

  issuedAt: computed ('iat', function () {
    const iat = this.get ('iat');
    return isPresent (iat) ? new Date (iat) : null;
  }),

  expiresAt: computed ('exp', function () {
    const exp = this.get ('exp');
    return isPresent (exp) ? new Date (exp) : null;
  }),

  isExpired: computed ('exp', function () {
    const exp = this.get ('exp');
    return isPresent (exp) ? (exp <= Date.now ()) : false;
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
    return micromatch.some (scope, this.get ('scope'));
  },

  /**
   * Evaluate if the metadata has a capability.
   *
   * @param capability
   */
  hasCapability (capability) {
    return micromatch.some (capability, this.get ('scope'));
  }
});
