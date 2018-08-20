import Gatekeeper from 'ember-cli-gatekeeper';

export default Gatekeeper.User.AuthenticatedRoute.extend({
  capabilities: null,

  init () {
    this._super (...arguments);

    this.set ('capabilities', ['gatekeeper.account'])
  }
});
