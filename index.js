/* eslint-env node */
'use strict';

module.exports = {
  name: 'ember-cli-gatekeeper',

  isDevelopingAddon () {
    return true;
  },

  included: function (app) {
    this._super.included.apply (this, arguments);
    app.import (app.bowerDirectory + '/jsrsasign/jsrsasign-all-min.js');
  }
};
