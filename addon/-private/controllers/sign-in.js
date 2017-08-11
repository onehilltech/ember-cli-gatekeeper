import Ember from 'ember';
import SignInMixin from '../mixins/sign-in';

export default Ember.Controller.extend (SignInMixin, {
  didSignIn () {

  },

  doTransition (name) {
    this.transitionToRoute (name);
  }
});
