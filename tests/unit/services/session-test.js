import { moduleFor, test } from 'ember-qunit';
import { startMirage } from 'dummy/initializers/ember-cli-mirage';

moduleFor('service:session', 'Unit | Service | session', {
  needs: ['service:local-storage', 'config:environment', 'model:account', 'serializer:account', 'adapter:account', 'service:gatekeeper'],

  beforeEach() {
    this.server = startMirage ();
    window.localStorage.clear ();
  },

  afterEach() {
    this.server.shutdown ();
  }
});

// Replace this with your real tests.
test ('it exists', function(assert) {
  let service = this.subject();

  assert.ok (service);
  assert.notOk (service.get ('currentUser'), 'expected no current user');
  assert.ok (service.get ('isSignedOut'), 'expected service to be signed out');
  assert.notOk (service.get ('isSignedIn'), 'expected service to not be signed in');
});

test ('it signs in', function (assert) {
  let service = this.subject ();

  assert.ok (service.get ('isSignedOut'));
  assert.notOk (service.get ('isSignedIn'));

  return service.signIn ({username: 'username', password: 'password'}).then (() => {
    assert.ok (service.get ('isSignedIn'));
    assert.notOk (service.get ('isSignedOut'));

    assert.deepEqual (service.get ('currentUser'), {id: '1', email: 'tester@no-reply.com', username: 'tester', password: null});
  }).catch ((err) => {
    assert.ok (false, err.message);
  });
});

test ('it signs out', function (assert) {
  let service = this.subject();

  return service.signIn ({username: 'username', password: 'password'}).then (() => {
    assert.ok (service.get ('isSignedIn'));
    assert.ok (service.get ('accessToken'));

    return service.signOut ();
  }).then (() => {
    assert.ok (service.get ('isSignedOut'));
    assert.notOk (service.get ('accessToken'));
    assert.notOk (service.get ('currentUser'));

  }).catch ((err) => {
    assert.ok (false, err.message);
  });
});

test ('it refreshes a token', function (assert) {
  let service = this.subject();

  return service.signIn ({username: 'username', password: 'password'}).then (() => {
    return service.refreshToken ();
  }).then (() => {
    assert.ok (service.get ('isSignedIn'));
    assert.deepEqual (service.get ('_userToken'), {token_type: 'Bearer', access_token: 'abcdefghij', refresh_token: 'jihgfedcba'});
  }).catch ((xhr) => {
    assert.ok (false, xhr.responseText);
  });
});
