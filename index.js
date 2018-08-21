/* eslint-env node */
'use strict';

const NodeBuiltins = require('rollup-plugin-node-builtins');
const NodeGlobals = require ('rollup-plugin-node-globals');

module.exports = {
  name: 'ember-cli-gatekeeper',

  included (app) {
    this._super (...arguments);

    app.import ('node_modules/jsrsasign/lib/jsrsasign-all-min.js');
    app.import ('node_modules/micromatch/index.js', {
      using: [
        { transformation: 'cjs', as: 'micromatch', plugins: [NodeBuiltins (), NodeGlobals ()] }
      ]
    })
  },

  importTransforms: require('ember-cli-cjs-transform').importTransforms
};
