import Controller from '@ember/controller';
import Gatekeeper from 'ember-cli-gatekeeper';
import { alias } from '@ember/object/computed';

export default Controller.extend({
  metadata: alias ('gatekeeper.metadata'),

  canCreateAccount: Gatekeeper.User.capability ('gatekeeper.account.create')
});
