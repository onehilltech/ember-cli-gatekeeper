import Ember from 'ember';
import SignInMixin from '../mixins/sign-in';

export default Ember.Component.extend (SignInMixin, {
  signInOptions: {},

  mergedProperties: ['signInOptions'],

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

  //== account creation properties

  routeForNewAccount: null,

  didSignIn () {
    this.get ('signInComplete') ();
  },
});
