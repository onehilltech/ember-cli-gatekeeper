import v2 from './v2';
import invisible from './invisible';

export default function recaptchaFactory (key) {
  switch (key) {
    case 'v2':
      return new v2 ();

    case 'invisible':
      return new invisible ();

    default:
      throw new Error (`${key} is an invalid recaptcha type`);
  }
}