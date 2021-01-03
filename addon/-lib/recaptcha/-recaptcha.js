import {tracked} from "@glimmer/tracking";

export default class Recaptcha {
  @tracked
  response;

  constructor (component) {
    this.component = component;
  }

  handleError ( ) {
    this.reset = true;
    this.response = null;
  }

  verify () {

  }

  verified (response) {
    this.response = response;
  }

  isVerified () {

  }
}

