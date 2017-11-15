import Ember from 'ember';
import SignInMixin from '../mixins/sign-in';

export default Ember.Component.extend (SignInMixin, {
  //== username properties

  usernameLabelText: 'Username',
  usernameType: 'text',
  usernamePlaceholder: 'Username',
  usernameAutoComplete: 'off',
  usernameFloatingLabel: true,

  //== password properties

  passwordLabelText: 'Password',
  passwordPlaceholder: 'Password',
  passwordFloatingLabel: true,

  //== button

  signInButtonColored: true,
  signInText: 'Sign In',
  signingInText: 'Signing in...',

  enableShowPassword: true,

  didSignIn () {
    this.get ('signInComplete') ();
  },
});
