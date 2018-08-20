/* eslint-env node */
'use strict';

const nodeBuiltins = require('rollup-plugin-node-builtins');

module.exports = {
  name: 'ember-cli-gatekeeper',

  included (app) {
    this._super (...arguments);

    app.import ('node_modules/jsrsasign/lib/jsrsasign-all-min.js');
    app.import ('node_modules/micromatch/index.js', {
      using: [
        { transformation: 'cjs', as: 'micromatch', plugins: [nodeBuiltins ()] }
      ]
    })
  }
};
