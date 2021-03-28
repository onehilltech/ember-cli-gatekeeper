import Component from '@glimmer/component';
import { tracked } from "@glimmer/tracking";
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { isPresent } from '@ember/utils';

function noOp () {}

export default class GatekeeperForgotPasswordComponent extends Component {
  @tracked
  email;

  @tracked
  emailErrorMessage;

  @tracked
  valid;

  @service
  gatekeeper;

  @service
  snackbar;

  get type () {
    return this.args.type || 'email';
  }

  get emailLabel () {
    return this.args.emailLabel || 'Email address';
  }

  get submitButtonLabel () {
    return this.args.submitButtonLabel || 'Submit';
  }

  @action
  validity (value) {
    this.valid = value;
  }

  get submitButtonDisabled () {
    return !this.valid;
  }

  get options () {
    return this.args.options;
  }

  get submitted () {
    return this.args.submitted || noOp;
  }

  @action
  submit () {
    this.emailErrorMessage = null;

    this.gatekeeper.forgotPassword (this.email, this.options)
      .then (() => this.submitted ())
      .catch (reason => {
        if (isPresent (reason.errors)) {
          const [error] = reason.errors;

          if (error.code === 'unknown_account') {
            this.emailErrorMessage = error.detail;
          }
          else {
            this.snackbar.show ( { message: error.detail, dismiss: true });
          }
        }
        else {
          this.snackbar.show ( { message: reason.message, dismiss: true });
        }
      });
  }
}
