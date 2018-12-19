import { computed } from '@ember/object';
import { isNone, isPresent } from '@ember/utils';

export default function (capability, metadata) {
  if (isNone (metadata)) {
    metadata = 'session.metadata';
  }

  return computed (`${metadata}.scope.[]`, function () {
    let meta = this.get (metadata);
    return isPresent (meta) ? meta.hasCapability (capability) : false;
  });
}
