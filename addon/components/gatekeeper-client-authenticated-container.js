import Component from '@glimmer/component';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { tracked } from "@glimmer/tracking";

function noOp () {}

/**
 * @class GatekeeperClientAuthenticatedContainerComponent
 */
export default class GatekeeperClientAuthenticatedContainerComponent extends Component {
  @service
  gatekeeper;

  @tracked
  authenticating;

  @service
  snackbar;

  get isAuthenticated () {
    return this.gatekeeper.isAuthenticated;
  }

  get isUnauthenticated () {
    return this.gatekeeper.isUnauthenticated;
  }

  @tracked
  execute;

  @action
  verifying (value) {
    this.authenticating = value;
  }

  @action
  verified (recaptcha) {
    return this.gatekeeper.authenticate ( { recaptcha }, true)
      .then (() => this.authenticated ())
      .catch (reason => this.failed (reason))
      .finally (() => this.authenticating = false);
  }

  get authenticated () {
    return this.args.authenticated || noOp;
  }

  get failed () {
    return this.args.failed || noOp;
  }
}
