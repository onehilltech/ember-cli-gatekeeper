import Ember from 'ember';

export default function (capability, metadata) {
  if (Ember.isNone (metadata)) {
    metadata = 'gatekeeper.metadata';
  }

  return Ember.computed (`${metadata}.scope.[]`, function () {
    let metadata = this.get ('gatekeeper.metadata');
    return Ember.isPresent (metadata) ? metadata.hasCapability (capability) : false;
  });
}
