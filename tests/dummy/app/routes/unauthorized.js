import Route from '@ember/routing/route';
import { authenticated } from "ember-cli-gatekeeper";

@authenticated
export default class UnauthorizedRoute extends Route {
  model () {
    return this.store.findAll ('dummy');
  }
}
