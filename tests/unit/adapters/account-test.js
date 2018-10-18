import { moduleFor, test } from 'ember-qunit';
import { startMirage } from 'dummy/initializers/ember-cli-mirage';
import { run } from '@ember/runloop';

moduleFor ('adapter:account', 'Unit | Adapter | account', {
  // Specify the other units that are required for this test.
  needs: [
    'config:environment',
    'model:account',
    'serializer:account',
    'service:session',
     'service:gatekeeper',
    'service:local-storage'
  ],

  beforeEach() {
    this.server = startMirage ();
    window.localStorage.clear ();
  },

  afterEach() {
    this.server.shutdown ();
  }
});

// Replace this with your real tests.
test ('it exists', function (assert) {
  let adapter = this.subject ();

  assert.ok (adapter);
});

test ('it creates a record', function (assert) {
  let adapter = this.subject ();
  let store = this.container.lookup ('service:store');

  return run (function() {
    let account = store.createRecord ('account', {
      id: 1,
      username: 'username',
      password: 'password',
      email: 'email'
    });

    let Model = store.modelFor ('account');
    let snapshot = account._createSnapshot ();

    return adapter.createRecord (account.store, Model, snapshot);
  }).then (result => {
    let account = result.account;

    assert.equal (account._id, 1);
    assert.equal (account.username, 'username');
    assert.equal (account.password, 'password');
    assert.equal (account.email, 'email');
  }).catch (err => {
    assert.ok (false, JSON.stringify (err));
  });
});