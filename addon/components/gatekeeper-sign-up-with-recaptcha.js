import SignUpComponent from './gatekeeper-sign-up';
import layout from '../templates/components/gatekeeper-sign-up-with-recaptcha';
import SupportsRecaptcha from '../-lib/mixins/supports-recaptcha';

export default SignUpComponent.extend (SupportsRecaptcha, {
  layout
});
