/* eslint-env node */
'use strict';

const merge = require ('lodash.merge');

module.exports = {
  name: 'ember-cli-gatekeeper',

  included (app) {
    this._super (...arguments);

    app.import ('node_modules/jsrsasign/lib/jsrsasign-all-min.js');

    // We are using ember-auto-import to import micromatch into the ember application.
    // The module uses 'fs', but the browser application really cannot use it in the
    // browser. We need to inform ember-auto-import to disregard the fs module, but
    // we do not want users of this add-on to manually update their application configuration.
    // Let's update the application options behind the scene so everything compiles.

    merge (app.options, {
      autoImport: {
        webpack: {
          node: {
            fs: 'empty'
          }
        }
      }
    });

  },
};
