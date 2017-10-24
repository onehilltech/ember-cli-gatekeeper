ember-cli-gatekeeper
====================

EmberJS add-on for [blueprint-gatekeeper](https://github.com/onehilltech/blueprint-gatekeeper)

[![npm version](https://img.shields.io/npm/v/ember-cli-gatekeeper.svg?maxAge=2592000)](https://www.npmjs.com/package/ember-cli-gatekeeper)
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
| gatekeeper.startRoute | Default route name, or url, to transition to after login | | index |
| gatekeeper.signInRoute | Name of the sign in route | | sign-in |      
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

### Protecting application routes

Protected application routes are routes that require the user to be signed in
to access. Creating protected application route is very simple.
 
First, create the route using [ember-cli](https://ember-cli.com/).

    ember g route [name]
    
Then, import `ember-cli-gatekeeper` into the generated route file, and extend from
`Gatekeeper.User.AuthenticatedRoute` instead of the default `Ember.Route`.

```javascript 1.6
// app/routes/comments.js

import Gatekeeper from 'ember-cli-gatekeeper';

export default Gatekeeper.User.AuthenticatedRoute.extend ({
  model () {
    let currentUser = this.get ('currentUser');
    return this.get ('store').query ('comments', {user: currentUser.id});
  }
});
```

The [gatekeeper](https://github.com/onehilltech/ember-cli-gatekeeper/blob/master/addon/services/gatekeeper.js) 
service is injected into all routes. The 
[AuthenticatedRoute](https://github.com/onehilltech/ember-cli-gatekeeper/blob/master/addon/-lib/user/authenticated-route.js) 
class provides the `currentUser` property, which gives you access to the 
[account model](https://github.com/onehilltech/ember-cli-gatekeeper/blob/master/addon/models/account.js)
(less the password) for the signed in user.

> When this route is accessed and the user is not signed in, the user will
> be transitioned to the `sign-in` route (see [Configuration](#defining-the-configuration)). After
> the user signs in, the user will be transitioned back to the original route.

### Accessing protected data

[ember-data](https://github.com/emberjs/data) uses data models to access resources on 
a remote server. When using Gatekeeper, the routes for accessing these resources is
protected via an authorization token. To get this authorization token into each
[ember-data](https://github.com/emberjs/data) request, you must extend your application 
(or model-specific adapter) from `Gatekeeper.User.RESTAdapter`.

```javascript 1.6
// app/adapters/application.js

import Gatekeeper from 'ember-cli-gatekeeper';

export default Gatekeeper.User.RESTAdapter.extend({
  
});
```

You can then continue [configuring the adapter](https://emberjs.com/api/ember-data/2.16/classes/DS.RESTAdapter) 
as normal.

### Signing in a user

### Signing out a user

A signed in user can be signed out from any where in the application as long as you
have access to the `gatekeeper` service.

> The `gatekeeper` service is injected into all routes and controllers.

```javascript 1.6
import Controller from '@ember/controller';

export default Controller.extend({
  actions: {
    signOut () {
      this.get ('gatekeeper').signOut ().then (() => {
        this.replaceRoute ('sign-in');
      });
    }
  }
});
```

### Allowing users to create accounts

We use the `account` model to create user accounts. We assume that you have
created a template to gather the `username`, `password`, and `email address`
from the user and have a controller action to that creates the account:

```javascript 1.6
import Controller from '@ember/controller';

export default Controller.extend({
  actions: {
    createAccount () {
      let {email, username, password} = this.getProperties (['email', 'username', 'password']);
      let account = this.get ('store').createRecord ('account', {username, password, email});
      let adapterOptions = {signIn: true};
      
      account.save ({adapterOptions}).then (account => {
        // You can transition to a protected application route
      }).catch (reason => {
        // Display error message to user
      });
    }
  }
});
```

The `save()` method takes an optional `adapterOptions` property that allows you to 
sign in the user when the account is created. The advantage of doing this it that 
it allows you to transition to a protected application route after account creation,
or access [protected data](#accessing-protected-data) as part of the creation process.
Otherwise, the user will have to sign in after creating the account to access a
protected application route.


Happy Coding!
