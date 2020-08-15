/* eslint-env node */

const { Blueprint } = require ('ember-cli-blueprint-helpers');

module.exports = Blueprint.extend ({
  addons: [
    {name: '@onehilltech/ember-cli-storage', target: '^1.0.0'},
    {name: 'ember-cli-mdc-form', target: '^1.0.0'},
    {name: 'ember-cli-mdc-textfield', target: '^1.0.0'},
    {name: 'ember-cli-mdc-button', target: '^1.0.0'},
    {name: 'ember-cli-mdc-snackbar', target: '^1.0.0'},
    {name: 'ember-cli-google-recaptcha', target: '^2.3.1'},
    {name: 'ember-api-actions', target: '^0.2.8'},
    {name: 'ember-data', target: '~3.16.0'},
    {name: 'ember-copy'},
  ]
});
