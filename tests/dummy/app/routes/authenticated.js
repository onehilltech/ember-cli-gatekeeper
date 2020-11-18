import Route from '@ember/routing/route';
import { authenticated } from 'ember-cli-gatekeeper';
import { action } from '@ember/object';

@authenticated({
  scope: 'foo'
})
export default class AuthenticatedRoute extends Route {
  @action
  unauthorized () {

  }
}
