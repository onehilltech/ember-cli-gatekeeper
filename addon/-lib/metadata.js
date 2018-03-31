import Ember from 'ember';
import micromatch from "npm:micromatch";

export default Ember.Object.extend ({
  /**
   * Evaluate if the metadata has a capability.
   *
   * @param capability
   */
  hasCapability (capability) {
    return micromatch.some (capability, this.get ('scope'));
  }
});
