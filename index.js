/* eslint-env node */
'use strict';

const merge = require ('lodash.merge');

module.exports = {
  name: 'ember-cli-gatekeeper',

  included (app) {
    this._super (...arguments);

    merge (app.options, {
      autoImport: {
        webpack: {
          node: {
            fs: 'empty'
          }
        }
      }
    });

    app.import ('node_modules/jsrsasign/lib/jsrsasign-all-min.js');
  },
};
