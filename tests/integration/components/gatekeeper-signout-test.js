import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('gatekeeper-signout', 'Integration | Component | gatekeeper signout', {
  integration: true
});

test('it renders', function(assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  let signOut = 'Sign out';
  this.set ('signOut', signOut);

  this.render (hbs`{{gatekeeper-signout label=signOut}}`);

  assert.equal (this.$ ('a').text ().trim (), signOut, 'set label for anchor tag');
});
