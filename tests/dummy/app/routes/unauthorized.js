import Route from '@ember/routing/route';
import { authenticated } from "ember-cli-gatekeeper";
import { service } from '@ember/service';

@authenticated
export default class UnauthorizedRoute extends Route {
  @service
  session;

  model () {
    return this.store.findAll ('dummy');
  }
}
