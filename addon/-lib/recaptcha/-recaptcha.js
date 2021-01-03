export default class Recaptcha {
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
}

