import { module, test } from 'qunit';
import { setupRenderingTest } from 'ember-qunit';
import { render, find, findAll } from '@ember/test-helpers';
import hbs from 'htmlbars-inline-precompile';

module('Integration | Component | gatekeeper sign in vertical', function(hooks) {
  setupRenderingTest(hooks);

  test('it renders [default]', async function(assert) {
    await render(hbs`{{gatekeeper-sign-in-vertical}}`);

    assert.equal (this.$ ('input.username').next ().text ().trim (), 'Username');
    assert.dom('input.username').hasAttribute('type', 'text');
    assert.dom('input.username').hasAttribute('placeholder', 'Username');
    assert.dom('input.username').hasAttribute('autocomplete', 'off');

    assert.equal (this.$ ('input.password').next ().text ().trim (), 'Password');
    assert.dom('input.password').hasAttribute('placeholder', 'Password');

    assert.dom('.btn.sign-in').hasText('Sign In');

    assert.dom('a.create-account').hasText('Do not have an account? Create one.');
  });

  test('it renders [no create account]', async function(assert) {

    this.set ('canCreateAccount', false);
    await render(hbs`{{gatekeeper-sign-in-vertical canCreateAccount=canCreateAccount}}`);

    assert.dom('a.create-account').doesNotExist();
  });
});