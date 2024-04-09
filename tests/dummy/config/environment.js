/* eslint-env node */
'use strict';

module.exports = function (environment) {
  const ENV = {
    modulePrefix: 'dummy',
    environment,
    rootURL: '/',
    locationType: 'history',
    EmberENV: {
      EXTEND_PROTOTYPES: false,
      FEATURES: {

      },
    },

    APP: {
      // Here you can pass flags/options to your application instance
      // when it is created
    },
    gatekeeper: {
      tokenOptions: {
        client_id: 'dummy',
        client_secret: 'ssshhh'
      }
    },

    'ember-cli-google': {
      recaptcha: {
        siteKey: '6LdcLDcUAAAAANCqibBJg2RZDRSUjqjoD8JvXVIx'
      }
    }
  };

  if (environment === 'development') {
    ENV['ember-cli-mirage'] = {
      enabled: false
    };

    ENV.gatekeeper = {
      startRoute: 'authenticated',
      signInRoute: 'sign-in.standard',
      baseUrl: 'http://localhost:8080/v1',
      tokenOptions: {
        client_id: '58ed90e1105aee00001e429f',
        client_secret: 'gatekeeper-android'
      },

      secret: 'ssshhh',

      verifyOptions: {
        alg: ['HS256'],
        iss: ['gatekeeper']
      }
    };

    // ENV.APP.LOG_RESOLVER = true;
    // ENV.APP.LOG_ACTIVE_GENERATION = true;
    // ENV.APP.LOG_TRANSITIONS = true;
    // ENV.APP.LOG_TRANSITIONS_INTERNAL = true;
    // ENV.APP.LOG_VIEW_LOOKUPS = true;
  }

  if (environment === 'test') {
    ENV.gatekeeper.baseUrl = 'http://gatekeeper';

      // Testem prefers this...
    ENV.locationType = 'none';

    // keep test console output quieter
    ENV.APP.LOG_ACTIVE_GENERATION = false;
    ENV.APP.LOG_VIEW_LOOKUPS = false;

    ENV.APP.rootElement = '#ember-testing';
  }

  if (environment === 'production') {
    ENV.gatekeeper.baseUrl = 'http://localhost:8080';
    ENV.gatekeeper.tokenOptions = {
      client_id: '58ed90e1105aee00001e429f',
      client_secret: 'gatekeeper-android'
    };

    ENV['ember-cli-mirage'] = {
      excludeFilesFromBuild: true
    };
  }

  return ENV;
};
