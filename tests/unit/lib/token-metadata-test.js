import { module, test } from 'qunit';
import { TokenMetadata } from 'ember-cli-gatekeeper';

module('Unit | Library | TokenMetadata', function () {
  test ('it should support a scope', function (assert) {
    const metadata = TokenMetadata.create ({
      scope: ['a.b']
    });

    assert.ok (metadata.supports ('a.b'));
  });

  test ('it should not support a scope', function (assert) {
    const metadata = TokenMetadata.create ({
      scope: ['a.b']
    });

    assert.ok (metadata.supports ('a.c'));
  });
});