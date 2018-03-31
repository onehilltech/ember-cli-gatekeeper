/* eslint-env node */
'use strict';

module.exports = function(environment) {
  let ENV = {
    modulePrefix: 'dummy',
    environment,
    rootURL: '/',
    locationType: 'auto',
    EmberENV: {
      FEATURES: {
        // Here you can enable experimental features on an ember canary build
        // e.g. 'with-controller': true
        'ds-improved-ajax': true
      },
      EXTEND_PROTOTYPES: {
        // Prevent Ember Data from overriding Date.parse.
        Date: false
      }
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
      baseUrl: 'http://localhost:8080',
      tokenOptions: {
        client_id: '5a206991201dc8357e45d174',
      },

      publicCert: '-----BEGIN CERTIFICATE-----\n' +
      'MIID3zCCAsegAwIBAgIJALFQVcyZayqWMA0GCSqGSIb3DQEBCwUAMIGFMQswCQYD\n' +
      'VQQGEwJVUzELMAkGA1UECAwCSU4xEDAOBgNVBAcMB0Zpc2hlcnMxIzAhBgNVBAoM\n' +
      'Gk9uZSBIaWxsIFRlY2hub2xvZ2llcywgTExDMQwwCgYDVQQLDANSJkQxJDAiBgkq\n' +
      'hkiG9w0BCQEWFWphbWVzQG9uZWhpbGx0ZWNoLmNvbTAeFw0xNjA4MDUwMzE5MTNa\n' +
      'Fw0xNzA4MDUwMzE5MTNaMIGFMQswCQYDVQQGEwJVUzELMAkGA1UECAwCSU4xEDAO\n' +
      'BgNVBAcMB0Zpc2hlcnMxIzAhBgNVBAoMGk9uZSBIaWxsIFRlY2hub2xvZ2llcywg\n' +
      'TExDMQwwCgYDVQQLDANSJkQxJDAiBgkqhkiG9w0BCQEWFWphbWVzQG9uZWhpbGx0\n' +
      'ZWNoLmNvbTCCASIwDQYJKoZIhvcNAQEBBQADggEPADCCAQoCggEBAK9J9+zFkq7B\n' +
      'Dn2TQMloYw0RpzenWygu0CVD2wmiUq4x/AdjVZ3Q1NP0X91nUr0sxiUT+BWPJDAR\n' +
      'sPmE8NuicqR/T5CmIn1GFnZI8UCLYZJwgsgVv7NKD5CaSlJ/Mq23L8ocDN2bIzzM\n' +
      'U1lQ/ee3I152c7BOXeA3KJ6M05VMMJ0A4H4TXmR25R4RJrrNwCqNNFUMhyNWxze6\n' +
      'gwLa3OyTTNbtLaL9xxvAJ8iEUR54z5pQBfL98DcoFTZvsVFuH6UB7it+jcf9AG6a\n' +
      'bf1EOVWql7PWDr3dKPsv1RaDgVa8MbvM/C//JUAAhzcUHWPx6eVORuTEXf9mI+UY\n' +
      'vKw2uRPYNykCAwEAAaNQME4wHQYDVR0OBBYEFI8obyWiFLkCLjLU0+rSN9EKea76\n' +
      'MB8GA1UdIwQYMBaAFI8obyWiFLkCLjLU0+rSN9EKea76MAwGA1UdEwQFMAMBAf8w\n' +
      'DQYJKoZIhvcNAQELBQADggEBAA1sogX19dp7uDLk2fPjQtmbZvNxtSO8Ue41lfFu\n' +
      'FJPjT97ctB5pXG2g4Xa7q3mEv4rhjgvm9XvlQnxeRkxNLiDuKGpF0lTRrakvFXhK\n' +
      '4TouOnAtCUjkaWfgpF8LzyIH07s3r1zVDJaokVBFY61nSBZ4V8VQQ780eSoXTjTf\n' +
      'qY7W1nbQw2tPPbE/jxOpFnMzRvddDmC3JH9Yk0IObb84ZCtz0RhlW/ERtvsMTrVA\n' +
      'pETYkW2/md97NgwTaRa3OEB7ABDM3MUfW3VyW5XqGVsCicE8S2MKgRSlWsJsrkaD\n' +
      'Zz4WGUy/87Yxma1ILbkYPM2wyL0gqrMhsqPxBRM+8tcdcE4=\n' +
      '-----END CERTIFICATE-----',

      verifyOptions: {
        alg: ['RS256'],
        iss: ['gatekeeper']
      }
    }
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
