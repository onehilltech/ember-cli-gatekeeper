import { AuthenticatedRoute } from 'ember-cli-gatekeeper';
import { Promise } from 'rsvp';

export default AuthenticatedRoute.extend({
  model () {
    return this.get ('store').findRecord ('account', this.get ('currentUser.id'), { reload: true });
  }
});
