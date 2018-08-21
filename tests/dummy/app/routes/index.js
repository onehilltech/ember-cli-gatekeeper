import { AuthenticatedRoute } from 'ember-cli-gatekeeper';

export default AuthenticatedRoute.extend({
  capabilities: null,

  init () {
    this._super (...arguments);

    //this.set ('capabilities', ['gatekeeper.account'])
  }
});
