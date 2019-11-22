import EmberObject from '@ember/object';
import ApplicationMixin from 'ember-cli-gatekeeper/mixins/application';
import { module, test } from 'qunit';

module('Unit | Mixin | application', function() {
  // Replace this with your real tests.
  test('it works', function (assert) {
    let ApplicationObject = EmberObject.extend(ApplicationMixin);
    let subject = ApplicationObject.create();
    assert.ok(subject);
  });
});
