import override from '@onehilltech/override';
import decorator from '@onehilltech/decorator';

function verified (target, name, descriptor, options = {}) {
  override.async (target.prototype, 'model', async function () {
    if (this.session.isSignedOut || this.session.account.verified) {
      return this._super.call (this, ...arguments);
    }
  });
}

export default decorator (verified);
