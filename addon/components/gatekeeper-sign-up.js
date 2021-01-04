import Component from '@glimmer/component';

import { action, get } from '@ember/object';
import { inject as service } from '@ember/service';
import { isPresent } from '@ember/utils';
import { tracked } from "@glimmer/tracking";

function identity (value) {
  return () => value ;
}

export default class GatekeeperSignUpComponent extends Component {
  @service
  store;

  @service
  gatekeeper;

  @service
  snackbar;

  @tracked
  valid;

  @tracked
  username;

  @tracked
  email;

  @tracked
  password;

  @tracked
  confirmed;

  @tracked
  usernameErrorMessage;

  @tracked
  emailErrorMessage;

  @tracked
  passwordErrorMessage;

  @action
  didInsert () {
    this.valid = false;
    this.submitting = false;
  }

  @action
  validity (value) {
    this.valid = value;
  }

  get signUpOptions () {
    return this.args.signUpOptions || {};
  }

  get style () {
    return this.args.style || 'outlined';
  }

  get submitButtonStyle () {
    return this.args.submitButtonStyle || 'raised';
  }

  get useEmailForUsername () {
    const { useEmailForUsername = true } = this.args;
    return useEmailForUsername;
  }

  get confirmPassword () {
    const { confirmPassword = true } = this.args;
    return confirmPassword;
  }

  get usernameLabel () {
    return this.args.usernameLabel || 'Username';
  }

  get emailLabel () {
    return this.args.emailLabel || 'Email address';
  }

  get passwordLabel () {
    return this.args.passwordLabel || 'Password';
  }

  get confirmPasswordLabel () {
    return this.args.confirmPasswordLabel || 'Confirm password';
  }

  get submitButtonText () {
    return this.args.submitButtonText || 'Create account';
  }

  get isConfirmed () {
    return !this.confirmPassword || this.password === this.confirmed;
  }

  get confirmPasswordErrorMessage () {
    return this.args.confirmPasswordErrorMessage || 'The passwords do not match.';
  }

  get confirmErrorMessage () {
    const { confirmPassword, password, confirmed } = this;
    return confirmPassword && isPresent (password) && isPresent (confirmed) ? (password !== confirmed ? this.confirmPasswordErrorMessage : null) : null;
  }

  get submitButtonDisabled () {
    return this.submitting || !this.isConfirmed || !this.valid;
  }

  get accountEnabled () {
    const { accountEnabled = true } = this.args;
    return accountEnabled;
  }

  get signIn () {
    const { signIn = false } = this.args;
    return signIn;
  }

  /**
   * Perform the submission of the information to create an account.
   */
  @action
  signUp (retryIfFail = true) {
    let {
      username,
      password,
      email,
      signIn,
      signUpOptions,
      useEmailForUsername,
      accountEnabled
    } = this;

    if (useEmailForUsername) {
      username = email;
    }

    // Reset the state of the component.
    this.reset ();

    this.submitting = true;
    let adapterOptions = Object.assign ({}, signUpOptions, { signIn });

    return Promise.resolve ()
      .then (() => this.doPrepareOptions (adapterOptions))
      .then (adapterOptions => {
        let account = this.store.createRecord ('account', {username, password, email, enabled: accountEnabled});
        return account.save ({ adapterOptions });
      })
      .then (account => {
        if (this.signUpComplete (account)) {
          this.gatekeeper.redirect (this.args.redirectTo);
        }
      })
      .catch (reason => this._handleError (reason, retryIfFail))
      .then (() => this.submitting = false);
  }

  doPrepareOptions (options) {
    return options;
  }

  reset () {
    this.usernameErrorMessage = null;
    this.passwordErrorMessage = null;
    this.emailErrorMessage = null;
  }

  get signUpComplete () {
    return this.args.signUpComplete || identity (true);
  }

  _handleError (reason, retryIfFail) {
    if (isPresent (reason.errors)) {
      const { errors: [ { code, detail }] } = reason;

      switch (code) {
        case 'missing_token':
        case 'unknown_token':
          if (retryIfFail) {
            return this.gatekeeper.authenticate (this.signUpOptions, true).then (() => this.signUp (false));
          }

          break;

        case 'username_exists':
          if (this.useEmailForUsername) {
            this.emailErrorMessage = detail;
          }
          else {
            this.usernameErrorMessage = detail;
          }
          break;

        case 'email_exists':
          this.emailErrorMessage = detail;
          break;

        case 'invalid_password':
          this.passwordErrorMessage = detail;
          break;

        default:
          this.snackbar.show ({ message: detail, dismiss: true  });
      }
    }
  }
}
