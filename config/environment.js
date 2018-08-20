/* eslint-env node */
'use strict';

module.exports = function (environment, appConfig) {
  if (!appConfig.EmberENV.FEATURES['ds-improved-ajax'])
    throw new Error ('You must enable ds-improved-ajax in EmberENV.FEATURES.');

  return { };
};
