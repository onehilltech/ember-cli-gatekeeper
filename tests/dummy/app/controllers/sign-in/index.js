import Controller from '@ember/controller';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { tracked } from "@glimmer/tracking";

export default class SignInIndexController extends Controller {
  @service
  gatekeeper;

  @tracked
  execute;

  @action
  authenticate () {
    this.execute = true;
  }

  @action
  verified (response) {
    this.gatekeeper.authenticate ({recaptcha: response}).then (() => this.execute = false);
  }
}
