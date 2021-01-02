import Component from '@glimmer/component';
import { tracked } from "@glimmer/tracking";

import { action, get, getWithDefault } from '@ember/object';
import { isPresent, isNone } from '@ember/utils';
import { getOwner } from '@ember/application';
import { inject as service } from '@ember/service';

function identity (value) {
  return () => value ;
}

/**
 * @class GatekeeperSignInComponent
 */
export default class GatekeeperSignInComponent extends Component {
  @tracked
  valid;

  @tracked
  submitting

  @tracked
  username;

  @tracked
  password;

  get signInOptions () {
    return this.args.signInOptions || {};
  }

  //== username properties

  get usernameLabel () {
    return this.args.usernameLabel || 'Username';
  }

  get usernameType () {
    return this.args.usernameType || 'text';
  }

  get usernameAutoComplete () {
    return this.args.usernameAutoComplete || 'off';
  }

  @action
  usernameLeadingIconClick () {
    return this.args.usernameLeadingIconClick || identity;
  }

  @action
  usernameTrailingIconClick () {
    return this.args.usernameTrailingIconClick || identity;
  }

  //== password properties

  get passwordLabel () {
    return this.args.passwordLabel || 'Password'
  }

  //== sign-in button

  get signInButtonText () {
    return this.args.signInButtonText || 'Sign In';
  }

  get signInButtonDisabled () {
    return this.submitting || this.invalid || this.args.signInDisabled;
  }

  //== sign-up button

  get showSignUpButton () {
    return this.args.showSignUpButton || false;
  }

  get signUpButtonText () {
    return this.args.signUpButtonText || 'Sign Up';
  }

  @service
  router;

  @service
  session;

  @action
  didInsert () {
    this.valid = false;
    this.submitting = false;

    this.username = this.args.username;
    this.password = this.args.password;
  }

  @tracked
  usernameErrorMessage;

  @tracked
  passwordErrorMessage;

  @tracked
  errorMessage;

  handleError (xhr) {
    let error = get (xhr, 'errors.0');

    if (isPresent (error)) {
      switch (error.code) {
        case 'invalid_username':
          this.usernameErrorMessage = error.detail;
          break;

        case 'invalid_password':
          this.passwordErrorMessage = error.detail;
          break;

        default:
          this.errorMessage = error.detail;
      }
    }
    else {
      this.errorMessage = xhr.message || xhr.statusText;
    }
  }

  /**
   * Perform the redirect to for the user. This will either take the user to the original
   * page they accessed before being redirected to the sign-in page, or the start route
   * if no redirect is present.
   *
   * @private
   */
  redirect () {
    // Perform the redirect from the sign in page.
    let redirectTo = this.args.redirectTo || this.redirectTo;

    if (isNone (redirectTo)) {
      // There is no redirect url. So, we either transition to the default route, or we
      // transition to the index.
      let ENV = getOwner (this).resolveRegistration ('config:environment');
      redirectTo = getWithDefault (ENV, 'gatekeeper.startRoute', 'index');
    }

    this.router.replaceWith (redirectTo);
  }

  get redirectTo () {
    let currentURL = this.router.currentURL;
    let [, query] = currentURL.split ('?');

    if (isNone (query)) {
      return null;
    }

    let params = query.split ('&');
    return params.reduce ((accum, param) => {
      let [name, value] = param.split ('=');
      return name === 'redirect' ? decodeURIComponent (value) : accum;
    }, null);
  }

  @action
  signIn () {
    let { username, password, signInOptions } = this;
    let options = Object.assign ({}, signInOptions, { username, password });

    // Reset the state of the component.
    this.reset ();

    this.submitting = true;

    // Let the subclass know we are signing in.
    return Promise.resolve (() => this.willSignIn ())
      .then (() => this.session.signIn (options))
      .then (() => this.didSignIn ())
      .then (() => {
        // Notify the subclass that the user did sign in to the application.
        if (this.signInComplete ()) {
          this.redirect ();
        }
      })
      .catch (this.handleError.bind (this))
      .then (() => this.submitting = false);
  }

  reset () {
    this.errorMessage = this.usernameErrorMessage = this.passwordErrorMessage = null;
  }

  willSignIn () {

  }

  didSignIn () {

  }

  get signInComplete () {
    return this.args.signInComplete || identity (true);
  }

  @action
  validity (valid) {
    this.valid = valid;
  }
}
