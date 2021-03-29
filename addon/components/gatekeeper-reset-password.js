import Component from '@glimmer/component';
import { tracked } from "@glimmer/tracking";
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { isPresent } from '@ember/utils';

function noOp () { }

export default class GatekeeperResetPasswordComponent extends Component {
  @tracked
  password;

  @tracked
  valid;

  @service
  gatekeeper;

  @service
  snackbar;

  get passwordLabel () {
    return this.args.passwordLabel || 'New password';
  }

  get submitButtonLabel () {
    return this.args.submitButtonLabel || 'Reset password';
  }

  get submitButtonDisabled () {
    return !this.valid;
  }

  get resetToken () {
    return this.args.resetToken;
  }

  @action
  validity (value) {
    this.valid = value;
  }

  get reset () {
    return this.args.reset || noOp;
  }

  @action
  submit () {
    this.gatekeeper.resetPassword (this.resetToken, this.password)
      .then (result => this.reset (result))
      .catch (reason => {
        const message = isPresent (reason.errors) ? reason.errors[0].detail : reason.message;
        this.snackbar.show ( { message, dismiss: true });
      });
  }
}
