import { moduleForModel, test } from 'ember-qunit';

moduleForModel('account', 'Unit | Serializer | account', {
  needs: ['model:account', 'serializer:account']
});

// Replace this with your real tests.
test ('it serializes records', function(assert) {
  assert.expect (5);

  let record = this.subject ({
    id: 1,
    username: 'username',
    password: 'password',
    email: 'email'
  });

  let serializedRecord = record.serialize ({includeId: true});

  assert.ok (serializedRecord, 'The record did not serialize');
  assert.ok (serializedRecord._id, 'The record is missing the _id');
  assert.equal (serializedRecord.username, 'username');
  assert.equal (serializedRecord.password, 'password');
  assert.equal (serializedRecord.email, 'email');
});
