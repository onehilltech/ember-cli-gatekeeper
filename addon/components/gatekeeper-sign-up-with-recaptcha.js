import SignUpComponent from './gatekeeper-sign-up';

import { tracked } from "@glimmer/tracking";
import { action } from '@ember/object';

import recaptchaFactory from "../-lib/recaptcha";

export default class GatekeeperSignUpWithRecaptchaComponent extends SignUpComponent {
  @tracked
  resetRecaptcha;

  @tracked
  executeRecaptcha;

  _recaptchaImpl;

  willSignUp () {
    return Promise.resolve (this._recaptchaImpl.verify (this))
      .then (response => this.gatekeeper.authenticate ({ recaptcha: response }))
  }

  doPrepareComponent () {
    this._recaptchaImpl = recaptchaFactory (this.recaptcha);
  }

  doPrepareOptions (options) {
    return Object.assign ({}, options, { recaptcha: this._recaptchaImpl.response });
  }

  @action
  verified (response) {
    this._recaptchaImpl.verified (response);
  }

  isSignUpDisabled () {
    return this._recaptchaImpl.isNextDisabled ();
  }

  get recaptcha () {
    return this.args.recaptcha || 'invisible';
  }

  get v2 () {
    return this.recaptcha === 'v2';
  }

  get invisible () {
    return this.recaptcha === 'invisible';
  }
}