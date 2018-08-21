import Controller from '@ember/controller';
import { supports } from 'ember-cli-gatekeeper';
import { alias } from '@ember/object/computed';

export default Controller.extend({
  metadata: alias ('session.metadata'),

  supportsCreateAccount: supports ('gatekeeper.account.create')
});
