import { AuthenticatedRoute } from 'ember-cli-gatekeeper';

export default AuthenticatedRoute.extend({
  model () {
    return this.get ('store').findAll ('dummy');
  }
});
