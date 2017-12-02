import Controller from '@ember/controller';

export default Controller.extend({
  init () {
    this._super (...arguments);

    let gatekeeper = this.get ('gatekeeper');
    gatekeeper.on ('signedOut', this.didSignOut.bind (this));
  },

  didSignOut () {
    this.replaceRoute ('sign-in');
  }
});
