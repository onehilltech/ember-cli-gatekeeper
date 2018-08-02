import Ember from 'ember';
import micromatch from "npm:micromatch";
import { computed } from '@ember/object';

export default Ember.Object.extend ({
  audience: computed.alias ('aud'),
  subject: computed.alias ('sub'),
  issuer: computed.alias ('iss'),

  issuedAt: computed ('iat', function () {
    const iat = this.get ('iat');
    return Ember.isPresent (iat) ? new Date (iat) : null;
  }),

  expiresAt: computed ('exp', function () {
    const exp = this.get ('exp');
    return Ember.isPresent (exp) ? new Date (exp) : null;
  }),

  isExpired: computed ('exp', function () {
    const exp = this.get ('exp');
    return Ember.isPresent (exp) ? (exp <= Date.now ()) : false;
  }),

  /// Test if the token has an expiration date.
  hasExpiration: computed.bool ('exp'),

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
