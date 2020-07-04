import SolidSignInComponent from './solid-sign-in';
import layout from '../templates/components/solid-sign-in-with-recaptcha';

import SupportsRecaptcha from 'ember-cli-gatekeeper/mixins/supports-recaptcha';

export default SolidSignInComponent.extend (SupportsRecaptcha, {
  layout,

  classNames: ['solid-sign-in-with-recaptcha']
});
