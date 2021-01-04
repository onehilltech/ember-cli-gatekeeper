import Recaptcha from "./-recaptcha";

/**
 * Recaptcha v2 is when the user much check the challenge box to verify they
 * are not a robot. This process is manual. There is no need to override any
 * of the default functionality since there is no need to automatically execute
 * the verification process.
 */
export default class RecaptchaInvisible extends Recaptcha {
  completed;

  verify (component) {
    return new Promise ((resolve) => {
      this.completed = resolve;

      component.executeRecaptcha = true;
    });
  }

  verified (response) {
    super.verified (response);
    this.completed (response);
  }

  isNextDisabled () {
    return false;
  }
}
