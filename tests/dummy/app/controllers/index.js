import { alias } from '@ember/object/computed';
import Controller from '@ember/controller';
import Gatekeeper from 'ember-cli-gatekeeper';

export default Controller.extend({
  metadata: alias ('gatekeeper.metadata'),

  canCreateAccount: Gatekeeper.User.capability ('gatekeeper.account.create')
});
