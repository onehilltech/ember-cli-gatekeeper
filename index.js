/* eslint-env node */
'use strict';

const merge = require ('lodash.merge');

module.exports = {
  name: 'ember-cli-gatekeeper',

  included (app) {
    this._super (...arguments);

    app.import ('node_modules/jsrsasign/lib/jsrsasign-all-min.js');
  },
};
