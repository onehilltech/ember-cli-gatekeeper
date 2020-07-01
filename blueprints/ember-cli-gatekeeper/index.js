/* eslint-env node */

const { Blueprint } = require ('ember-cli-blueprint-helpers');

module.exports = Blueprint.extend ({
  packages: [
    {name: 'jsrsasign', target: '8.0.12'}
  ],

  addons: [
    {name: '@onehilltech/ember-cli-storage', target: '0.2.1'},
    {name: 'ember-cli-mdc-form', target: '^1.0.0'},
    {name: 'ember-cli-mdc-textfield', target: '^1.0.0'},
    {name: 'ember-cli-mdc-button', target: '^1.0.0'},
    {name: 'ember-cli-mdc-snackbar', target: '^1.0.0'},
    {name: 'ember-copy'},
    {name: 'ember-cli-google-recaptcha', target: '^2.3.1'},
    {name: 'ember-api-actions', target: '^0.2.8'},
    {name: 'ember-lodash'}
  ]
});
