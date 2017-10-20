import Gatekeeper from 'ember-cli-gatekeeper';

export default Gatekeeper.User.AuthenticatedRoute.extend({
  model () {
    return this.get ('store').findAll ('dummy');
  }
});
