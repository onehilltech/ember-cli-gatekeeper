import Ember from 'ember';

export default function (capability, metadata) {
  if (Ember.isNone (metadata)) {
    metadata = 'session.metadata';
  }

  return Ember.computed (`${metadata}.scope.[]`, function () {
    let meta = this.get (metadata);
    return Ember.isPresent (meta) ? meta.hasCapability (capability) : false;
  });
}
