import Recaptcha from "./-recaptcha";
import { isNone } from '@ember/utils';

/**
 * Recaptcha v2 is when the user much check the challenge box to verify they
 * are not a robot. This process is manual. There is no need to override any
 * of the default functionality since there is no need to automatically execute
 * the verification process.
 */
export default class RecaptchaV2 extends Recaptcha {
  isNextDisabled () {
    return isNone (this.response);
  }
}