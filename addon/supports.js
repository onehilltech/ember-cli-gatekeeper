import { isNone, isPresent } from '@ember/utils';
import { computed } from '@ember/object';

export default function (name, propertyName) {
  if (isNone (propertyName)) {
    propertyName = 'session.accessToken';
  }

  return computed (`${propertyName}.scope.[]`, function () {
    let accessToken = this.get (propertyName);
    return isPresent (accessToken) ? accessToken.supports (name) : false;
  });
}
