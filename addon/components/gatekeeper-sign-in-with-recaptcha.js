import SignInComponent from './gatekeeper-sign-in';
import layout from '../templates/components/gatekeeper-sign-in-with-recaptcha';
import SupportsRecaptcha from '../mixins/supports-recaptcha';

export default SignInComponent.extend (SupportsRecaptcha, {
  layout
});
