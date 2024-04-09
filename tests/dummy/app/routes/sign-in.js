import Route from '@ember/routing/route';
import { unauthenticated } from 'ember-cli-gatekeeper';
import { service } from '@ember/service';

@unauthenticated
export default class SignInRoute extends Route {
  @service
  session;
}
