import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';

import { run } from '@ember/runloop';

module('Unit | Serializer | account', function(hooks) {
  setupTest(hooks);

  // Replace this with your real tests.
  test ('it serializes records', function(assert) {
    assert.expect (5);

    let record = run(() => this.owner.lookup('service:store').createRecord('account', {
      id: 1,
      username: 'username',
      password: 'password',
      email: 'email'
    }));

    let serializedRecord = record.serialize ({includeId: true});

    assert.ok (serializedRecord, 'The record did not serialize');
    assert.ok (serializedRecord._id, 'The record is missing the _id');
    assert.equal (serializedRecord.username, 'username');
    assert.equal (serializedRecord.password, 'password');
    assert.equal (serializedRecord.email, 'email');
  });
});
