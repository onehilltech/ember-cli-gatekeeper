/* eslint-env node */
'use strict';

module.exports = function (environment, appConfig) {
  return {
    autoImport: {
      webpack: {
        node: {
          fs: 'empty'
        }
      }
    }
  };
};
