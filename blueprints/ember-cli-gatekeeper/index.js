/* eslint-env node */

const { Blueprint } = require ('ember-cli-blueprint-helpers');

module.exports = Blueprint.extend ({
  addons: [
    {name: '@onehilltech/ember-cli-storage', target: '^1.0.0'},
    {name: 'ember-api-actions', target: '^0.2.8'},
    {name: 'ember-blueprint-data'},
    {name: 'ember-cli-google-recaptcha', target: '^2.3.1'},
    {name: 'ember-data-model-fragments', target: '^5.0.0-beta.1' },
    {name: 'ember-cli-mdc-form', target: '^2.0.0'},
    {name: 'ember-cli-mdc-textfield', target: '^2.0.0'},
    {name: 'ember-cli-mdc-button', target: '^2.0.0'},
    {name: 'ember-cli-mdc-snackbar', target: '^2.0.0'},
    {name: 'ember-cli-mdc-checkbox', target: '^2.0.0'}
  ]
});
