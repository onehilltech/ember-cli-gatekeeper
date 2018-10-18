import { run } from '@ember/runloop';
import { moduleForModel, test } from 'ember-qunit';
import { startMirage } from 'dummy/initializers/ember-cli-mirage';

moduleForModel ('account', 'Unit | Model | account', {
  needs: [
    'config:environment',
    'model:account',
    'adapter:account',
    'serializer:account',
    'service:gatekeeper',
    'service:gatekeeper-client',
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

test ('it exists', function (assert) {
  let model = this.subject ();
  assert.ok (!!model);
});

test ('it saves the model', function (assert) {
  let model = this.subject ({
    id: 1,
    username: 'username',
    password: 'password',
    email: 'email'
  });

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
