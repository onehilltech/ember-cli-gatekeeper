import { moduleFor, test } from 'ember-qunit';

moduleFor('service:gatekeeper-client', 'Unit | Service | gatekeeper client', {
  needs: ['service:local-storage', 'config:environment']
});

// Replace this with your real tests.
test('it exists', function(assert) {
  let service = this.subject();
  assert.ok(service);
});
