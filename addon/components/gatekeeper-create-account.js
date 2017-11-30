import CreateAccountMixin from '../-lib/mixins/create-account';
import layout from '../templates/components/gatekeeper-create-account';
import Ember from 'ember';

export default Ember.Component.extend (CreateAccountMixin, {
  layout,

  classNames: ['gk-form--create-account'],

  confirmPassword: true,

  submitButtonColor: 'primary',

  submitButtonText: 'Create My Account',

  confirmErrorMessage: Ember.computed ('confirmedPassword', function () {
    let {confirmedPassword,passwordMatches} = this.getProperties (['confirmedPassword','passwordMatches']);
    return Ember.isPresent (confirmedPassword) && !passwordMatches  ? 'The password does not match' : null;
  }),

  passwordMatches: Ember.computed ('{password,confirmedPassword}', function () {
    let {password,confirmPassword,confirmedPassword} = this.getProperties (['password','confirmPassword','confirmedPassword']);
    return !confirmPassword || (!Ember.isEmpty (password) && password === confirmedPassword);
  }),

  disableSubmit: Ember.computed ('{submitting,useEmailForUsername,username,email,password,confirmPassword,confirmedPassword}', function () {
    let {
      submitting,
      useEmailForUsername,
      username,
      email,
      password,
      passwordMatches
    } = this.getProperties (['submitting', 'useEmailForUsername','username','email','password','passwordMatches']);

    if (submitting) {
      return true;
    }

    if (useEmailForUsername) {
      username = email;
    }

    return Ember.isEmpty (username) ||
      Ember.isEmpty (email) ||
      Ember.isEmpty (password) ||
      !passwordMatches;
  }),

  didCreateAccount: Ember.on ('didCreateAccount', function (account) {
    this.sendAction ('accountCreated', account);
  }),

  handleError: Ember.on ('error', function (xhr) {
    this.set ('messageToUser', xhr.statusText);
  })
});
