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

  @tracked
  submitting;

  @action
  didInsert () {
    this.submitting = false;
  }

  get type () {
    return this.args.type || 'email';
  }

  get emailLabel () {
    return this.args.emailLabel || 'Email address';
  }

  get submitButtonLabel () {
    return this.args.submitButtonLabel || 'Submit';
  }

  get submittingButtonLabel () {
    return this.args.submittingButtonLabel || 'Submitting...';
  }

  @action
  validity (value) {
    this.valid = value;
  }

  get submitButtonDisabled () {
    return !this.valid || this.submitting || this.args.submitButtonDisabled;
  }

  get options () {
    return this.args.options;
  }

  get submitted () {
    return this.args.submitted || noOp;
  }

  @action
  submit () {
    const email = this.email.trim ();

    this.emailErrorMessage = null;
    this.submitting = true;

    this.gatekeeper.forgotPassword (email, this.options)
      .then (() => this.submitted (email))
      .catch (reason => {
        this.submitting = false;

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
