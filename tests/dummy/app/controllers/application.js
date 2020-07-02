import Controller from '@ember/controller';

export default Controller.extend({
  init () {
    this._super (...arguments);

    const session = this.session;
    session.on ('signedOut', this.didSignOut.bind (this));
  },

  didSignOut () {
    this.replaceRoute ('sign-in');
  }
});
