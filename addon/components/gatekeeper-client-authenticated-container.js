import Component from '@glimmer/component';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { tracked } from "@glimmer/tracking";

function noOp () {}

/**
 * @class GatekeeperClientStatus
 *
 * The gatekeeper status class is used to yield the status of the component back to the
 * parent component. This allows the parent component to show different elements based
 * on the client authentication status.
 */
class GatekeeperClientStatus {
    constructor (component) {
      this.component = component;
    }

    get isAuthenticating () {
      return this.component.authenticating;
    }

    get isAuthenticated () {
      return this.component.isAuthenticated;
    }

    get isUnauthenticated () {
      return this.component.isUnauthenticated;
    }
}
/**
 * @class GatekeeperClientAuthenticatedContainerComponent
 *
 * A container class that allows parents to show elements based on the client
 * authentication status.
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
  status;

  @action
  didInsert () {
    this.status = new GatekeeperClientStatus (this);
  }

  @action
  verifying (value) {
    this.authenticating = value;

    (this.args.verifying || noOp)(value);
  }

  @action
  async verified (recaptcha) {
    try {
      const options = Object.assign ({}, this.authenticateOptions, { recaptcha });
      await this.gatekeeper.authenticate (options, true);
      await this.authenticated ();
    }
    catch (reason) {
      await this.failed (reason);
    }
    finally {
      this.authenticating = false;
    }
  }

  get authenticateOptions () {
    return this.args.authenticateOptions || {};
  }

  get authenticated () {
    return this.args.authenticated || noOp;
  }

  get failed () {
    return this.args.failed || noOp;
  }
}
