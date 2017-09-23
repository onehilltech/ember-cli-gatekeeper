import Ember from 'ember';
import SignInMixin from '../mixins/sign-in';

export default Ember.Component.extend (SignInMixin, {
  //== username properties

  usernameLabelText: 'Username',
  usernameType: 'text',
  usernamePlaceholder: 'Username',
  usernameAutoComplete: 'off',

  //== password properties

  passwordLabelText: 'Password',
  passwordPlaceholder: 'Password',

  //== button

  signInText: 'Sign In',
  signingInText: 'Signing in...',

  enableShowPassword: true,

  init () {
    this._super (...arguments);

    this.set ('errorMessage', this.get ('gatekeeper.errorMessage'));
  },

  didSignIn () {
    this.get ('signInComplete') ();
  },
});
