import Component from '@glimmer/component';

import { tracked } from "@glimmer/tracking";
import { action } from '@ember/object';
import { inject as service } from '@ember/service';

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

  @tracked
  submitting;

  @action
  didInsert () {
    this.submitting = false;
  }

  get passwordLabel () {
    return this.args.passwordLabel || 'New password';
  }

  get submitButtonLabel () {
    return this.args.submitButtonLabel || 'Reset password';
  }

  get submittingButtonLabel () {
    return this.args.submittingButtonLabel || 'Resetting password...';
  }

  get submitButtonDisabled () {
    return !this.valid || this.args.submitButtonDisabled || this.submitting;
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
  async submit () {
    try {
      // Mark the reset form as submitting.
      this.submitting = true;
      (this.args.resetting || noOp)(true);

      const result = await this.gatekeeper.resetPassword (this.resetToken, this.password);
      this.reset (result);
    }
    catch (reason) {
      this.snackbar.showError (reason);
    }
    finally {
      // Reset the submitting state of the form.
      this.submitting = false;
      (this.args.resetting || noOp)(false);
    }
  }
}
