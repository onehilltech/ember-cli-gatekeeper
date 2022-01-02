import Component from '@glimmer/component';

import { action } from '@ember/object';
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
  submitting;

  @action
  didInsert (element) {
    this.valid = false;
    this.submitting = false;

    this.doPrepareComponent (element);
  }

  doPrepareComponent (/* element */) {

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

  get passwordErrorMessage () {
    return this.args.passwordErrorMessage;
  }

  get submitButtonText () {
    return this.submitting ? 'Creating account...' : (this.args.submitButtonText || 'Create account');
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
    return isPresent (this.passwordErrorMessage) ||
      this.submitting ||
      !this.isConfirmed ||
      !this.valid ||
      this.args.signUpDisabled ||
      this.isSignUpDisabled ();
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
  async signUp (retryIfFail = true) {
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

    try {
      // Reset the state of the component.
      this.reset ();

      // Let the client know we are submitting.
      this.submitting = true;
      let adapterOptions = Object.assign ({}, signUpOptions, { signIn });

      await this.willSignUp ();
      adapterOptions = await this.doPrepareOptions (adapterOptions);

      let account = this.store.createRecord ('account', {username, password, email, enabled: accountEnabled});
      await account.save ({ adapterOptions });

      if (this.signUpComplete (account)) {
        this.gatekeeper.redirect (this.args.redirectTo);
      }
    }
    catch (reason) {
      this.handleError (reason, retryIfFail)
    }
    finally {
      this.submitting = false;
    }
  }

  @action
  verified (response) {
    this._recaptchaImpl.verified (response);
  }

  willSignUp () {

  }

  doPrepareOptions (options) {
    return options
  }

  isSignUpDisabled () {
    return false;
  }

  reset () {
    this.usernameErrorMessage = null;
    this.emailErrorMessage = null;
  }

  get signUpComplete () {
    return this.args.signUpComplete || identity (true);
  }

  /**
   * Handle the sign up error.
   *
   * @param reason
   * @param retryIfFail
   * @returns {*}
   */
  handleError (reason, retryIfFail) {
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

        case '_id_exists':
          if (this.useEmailForUsername) {
            this.emailErrorMessage = 'An account already exists for this email address.';
          }
          else {
            this.usernameErrorMessage = 'An account already exists for this email address.';
          }
          break;

        case 'email_exists':
          this.emailErrorMessage = detail;
          break;

        default:
          this.snackbar.show ({ message: detail, dismiss: true  });
      }
    }
  }
}
