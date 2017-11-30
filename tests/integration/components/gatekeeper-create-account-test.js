import { moduleForComponent, test } from 'ember-qunit';
import hbs from 'htmlbars-inline-precompile';

moduleForComponent('gatekeeper-create-account', 'Integration | Component | gatekeeper create account', {
  integration: true
});

test('it renders', function(assert) {
  // Set any properties with this.set('myProperty', 'value');
  // Handle any actions with this.on('myAction', function(val) { ... });

  this.render(hbs`{{gatekeeper-create-account}}`);

  assert.equal(this.$().text().trim(), '');

  // Template block usage:
  this.render(hbs`
    {{#gatekeeper-create-account}}
      template block text
    {{/gatekeeper-create-account}}
  `);

  assert.equal(this.$().text().trim(), 'template block text');
});
