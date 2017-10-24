ember-cli-gatekeeper
====================

EmberJS add-on for [blueprint-gatekeeper](https://github.com/onehilltech/blueprint-gatekeeper)

[![npm version](https://img.shields.io/npm/v/@onehilltech/ember-cli-gatekeeper.svg?maxAge=2592000)](https://www.npmjs.com/package/@onehilltech/ember-cli-gatekeeper)
[![Dependencies](https://david-dm.org/onehilltech/ember-cli-gatekeeper.svg)](https://david-dm.org/onehilltech/ember-cli-gatekeeper)

Installation
--------------

    ember install ember-cli-gatekeeper
    
Getting Started
----------------

### Defining the configuration

Update the `ENV` variable in `config/environment.js` with the required
configuration values:

| Name  | Description | Required | Default Value |
|-------|-------------|----------|---------------|
| gatekeeper.baseUrl | Location of blueprint-gatekeeper | Yes | |
| gatekeeper.startRoute | Default route name, or url, to transition to after login | | sign-in |      
| gatekeeper.tokenOptions.client_id | Client id | Yes | |
| gatekeeper.tokenOptions.client_secret | Client secret | | |

The client secret should only be used if the web application is installed in
a trusted environment, such as a mobile application via [ember-cordova](http://embercordova.com/).

Here is an example `config/environment.js` with the Gatekeeper configuration:

```javascript 1.6
let ENV = {
  /// ...
  
  gatekeeper: {
    baseUrl: 'https://mydomain.com/gatekeeper',

    tokenOptions: {      
      client_id: '59ee923e1fd71c2ae68ade62',
      client_secret: '1234567890'
    }
  }
}
```

Happy Coding!

Next Steps
-----------

See the [Wiki](https://github.com/onehilltech/ember-cli-gatekeeper/wiki) for 
more information.
