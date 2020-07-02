import Route from '@ember/routing/route';
import { authenticated } from 'ember-cli-gatekeeper';
import { get } from '@ember/object';

@authenticated
export default class IndexRoute extends Route {
  async model () {
    let currentUserId = get (this, 'currentUser.id');
    return this.store.findRecord ('account', currentUserId, { reload: true });
  }
}
