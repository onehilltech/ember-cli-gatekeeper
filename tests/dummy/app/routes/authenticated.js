import Route from '@ember/routing/route';
import { authenticated } from 'ember-cli-gatekeeper';

@authenticated({
  scope: 'foo'
})
export default class AuthenticatedRoute extends Route {
}
