import { run } from '@ember/runloop';
import { module, test } from 'qunit';
import { setupTest } from 'ember-qunit';
import { startMirage } from 'dummy/initializers/ember-cli-mirage';

module('Unit | Model | account', function(hooks) {
  setupTest(hooks);

  hooks.beforeEach(function() {
    this.server = startMirage ();
    window.localStorage.clear ();
  });

  hooks.afterEach(function() {
    this.server.shutdown ();
  });

  test ('it exists', function (assert) {
    let model = run(() => this.owner.lookup('service:store').createRecord('account'));
    assert.ok (!!model);
  });

  test ('it saves the model', function (assert) {
    let model = run(() => this.owner.lookup('service:store').createRecord('account', {
      id: 1,
      username: 'username',
      password: 'password',
      email: 'email'
    }));

    return run (function () {
      return model.save ().then ((account) => {
        assert.equal (account.get ('id'), 1);
        assert.equal (account.get ('username'), 'username');
        assert.equal (account.get ('password'), 'password');
        assert.equal (account.get ('email'), 'email');
      }).catch ((err) => {
        assert.ok (false, JSON.stringify (err));
      });
    });
  });
});
