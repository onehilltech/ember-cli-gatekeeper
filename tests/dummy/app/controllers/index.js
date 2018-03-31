import Controller from '@ember/controller';

export default Controller.extend({
  metadata: Ember.computed.alias ('gatekeeper.metadata'),
});
