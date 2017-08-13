import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('gatekeeper-sign-in-vertical', 'Integration | Component | gatekeeper sign in vertical', {
  integration: true
});

test('it renders [default]', function(assert) {
  this.render(hbs`{{gatekeeper-sign-in-vertical}}`);

  assert.equal (this.$ ('input.username').next ().text ().trim (), 'Username');
  assert.equal (this.$ ('input.username').attr ('type'), 'text');
  assert.equal (this.$ ('input.username').attr ('placeholder'), 'Username');
  assert.equal (this.$ ('input.username').attr ('autocomplete'), 'off');

  assert.equal (this.$ ('input.password').next ().text ().trim (), 'Password');
  assert.equal (this.$ ('input.password').attr ('placeholder'), 'Password');

  assert.equal (this.$ ('.btn.sign-in').text ().trim (), 'Sign In');

  assert.equal (this.$ ('a.create-account').text ().trim (), 'Do not have an account? Create one.');
});

test('it renders [no create account]', function(assert) {

  this.set ('canCreateAccount', false);
  this.render(hbs`{{gatekeeper-sign-in-vertical canCreateAccount=canCreateAccount}}`);

  assert.equal (this.$ ('a.create-account').length, 0);
});