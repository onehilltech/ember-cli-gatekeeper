import { tracked } from "@glimmer/tracking";

export default class Recaptcha {
  @tracked
  response;

  verify () {
    return this.response;
  }

  verified (response) {
    this.response = response;
  }

  isNextDisabled () {

  }
}

