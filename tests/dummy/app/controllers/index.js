import Controller from '@ember/controller';
import Gatekeeper from 'ember-cli-gatekeeper';
import Ember from 'ember';

export default Controller.extend({
  metadata: Ember.computed.alias ('gatekeeper.metadata'),

  canCreateAccount: Gatekeeper.User.capability ('gatekeeper.account.create')
});
