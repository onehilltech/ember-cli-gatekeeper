import Route from '@ember/routing/route';
import { authenticated } from 'ember-cli-gatekeeper';
import { action } from '@ember/object';
import { service } from '@ember/service';

@authenticated({
  scope: 'foo'
})
export default class AuthenticatedRoute extends Route {
  @service
  session;

  @action
  unauthorized () {

  }
}
