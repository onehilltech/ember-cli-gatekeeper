import CreateAccountComponent from '../-lib/components/create-account';
import layout from '../templates/components/gatekeeper-create-account';
import Ember from 'ember';

export default CreateAccountComponent.extend ({
  layout,

  classNames: ['gk-form--create-account'],

  confirmPassword: true,

  handleError: Ember.on ('error', function (xhr) {
    this.set ('messageToUser', xhr.statusText);
  })
});
