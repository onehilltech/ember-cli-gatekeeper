import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { startMirage } from 'dummy/initializers/ember-cli-mirage';
import { run } from '@ember/runloop';

module('Unit | Adapter | account', function(hooks) {
  setupTest(hooks);

  hooks.beforeEach(function() {
    this.server = startMirage ();
    window.localStorage.clear ();
  });

  hooks.afterEach(function() {
    this.server.shutdown ();
  });

  // Replace this with your real tests.
  test ('it exists', function (assert) {
    let adapter = this.owner.lookup('adapter:account');

    assert.ok (adapter);
  });

  test ('it creates a record', function (assert) {
    let adapter = this.owner.lookup('adapter:account');
    let store = this.owner.lookup ('service:store');

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
});