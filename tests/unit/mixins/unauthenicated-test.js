import EmberObject from '@ember/object';
import UnauthenicatedMixin from 'ember-cli-gatekeeper/mixins/unauthenicated';
import { module, test } from 'qunit';

module('Unit | Mixin | unauthenicated', function() {
  // Replace this with your real tests.
  test('it works', function (assert) {
    let UnauthenicatedObject = EmberObject.extend(UnauthenicatedMixin);
    let subject = UnauthenicatedObject.create();
    assert.ok(subject);
  });
});
