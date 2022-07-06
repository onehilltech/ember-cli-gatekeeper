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

## Defining the configuration

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
  // ...
  
  EmberENV: {
    FEATURES: {
    // This must be enabled for account adapter to work.
    'ds-improved-ajax': true
    }
    
    // ...
  },
  
  gatekeeper: {
    baseUrl: 'https://mydomain.com/gatekeeper',

    tokenOptions: {      
      client_id: '59ee923e1fd71c2ae68ade62',
      client_secret: '1234567890'
    }
  }
}
```

## Protecting application routes

Protected application routes are routes that require the user to be signed in
to access. Creating protected application route is very simple.
 
First, create the route using [ember-cli](https://ember-cli.com/).

    ember g route [name]
    
Then, import the `authenticated` decorator from `ember-cli-gatekeeper` and apply it
to the route.

```javascript
// app/routes/comments.js

import Route from '@ember/routing/route';
import { authenticated } from 'ember-cli-gatekeeper';

@authenticated
export default class CommentsRoute extends Route {
  async model () {
    // Get the user for the current session.
    return this.store.query ('comments', { user: this.session.currentUser.id });
  }
};
```

The [session](https://github.com/onehilltech/ember-cli-gatekeeper/blob/master/addon/services/session.js) 
service is injected into all routes. This service can be used to access the
`currentUser` property, which gives you access to the 
[account model](https://github.com/onehilltech/ember-cli-gatekeeper/blob/master/addon/models/account.js)
(less the password) for the signed in user.

> When this route is accessed and the user is not signed in, the user will
> be transitioned to the `sign-in` route (see [Configuration](#defining-the-configuration)). After
> the user signs in, the user will be transitioned back to the original route.

## Making authorized requests

[ember-data](https://github.com/emberjs/data) uses data models to access resources on 
a remote server. When using Gatekeeper, the routes for accessing these resources is
protected via an authorization token. To get this authorization token into each
[ember-data](https://github.com/emberjs/data) request, you must use the `@bearer`
decorator.

```javascript
// app/adapters/application.js
import RESTAdapter from "@ember-data/adapter/rest";
import {bearer} from 'ember-cli-gatekeeper';

@bearer
export default class ApplicationAdapter extends RESTAdapter {
  
}
```

You can then continue [configuring the adapter](https://emberjs.com/api/ember-data/3.3/classes/DS.RESTAdapter) 
as normal.

## Signing in a user

To sign in a user, you need a route with a form that collects the user's username
and password. The Gatekeeper add-on provides a component/form that can be used to sign-in 
a user.

```handlebars
<GatekeeperSignIn />
```

This component needs to be added to your sign-in route. When the user has signed in 
successfully, the component will automatically route the user to either the
start route defined in the configuration, or the route originally accessed when
the user was not authenticated. 

### Using reCAPTCHA

Gatekeeper uses different public/private key verification schemes to ensure that robots are 
not accessing the system. When developing a web application, it is not save 
to place a secret in an EmberJS application because it will be accessible to site visitors.
We therefore recommend you use a reCAPTCHA service, such as Google reCAPTCHA, to verify users
are not robots.

Gatekeeper provides out-of-the-box support for Google reCAPTCHA via the 
[ember-cli-google-recaptcha](https://github.com/onehilltech/ember-cli-google-recaptcha) add-on.
First, you have to do is add your `siteKey` to `config/environment.js`:

```javascript
let ENV = {
  // ...
  
  'ember-cli-google': {
    recaptcha: {
      siteKey: 'This is where my siteKey goes'
    }
  }
};
```

The add-on will automatically detect the presence of the `siteKey`, and enable Google reCAPTCHA
in the default login form. Next, you replace the standard sign in component with the 
reCAPTCHA sign in component.

```handlebars
<GatekeeperSignInWithRecaptcha recaptcha="v2" />
```

> Set `recaptcha="invisible"` to use invisible reCAPTCHA.

## Signing out a user

A signed in user can be signed out from any where in the application as long as you
have access to the `session` service.

> The `session` service is injected into all routes and controllers.

```javascript
// app/controllers/index.js

import Controller from '@ember/controller';
import { action } from '@ember/object';

export default class IndexController extends Controller {
  @action
  async signOut () {
    await this.session.signOut ();
    this.replaceRoute ('sign-in');
  }
}
```

## Allowing users to create accounts

The Gatekeeper add-on also provides a default form for creating a new account. You use
it in a similar manner as signing in a user. First, add the sign up form to the route for
signing up a user, and configure the form to your needs.

```handlebars
<GatekeeperSignUp />
```

> The Gatekeeper add-on also has sign up components that supports reCAPTCHA.

> The client registered with the server must have the `gatekeeper.account.create` scope.
> Otherwise, the client will not be authorized to create the account.

### Manually creating an account

We use the `account` model to create user accounts. We assume that you have
created a template to gather the `username`, `password`, and `email address`
from the user and have a controller action to that creates the account:

```javascript
import Controller from '@ember/controller';
import { action } from '@ember/object';

export default class SignUpController extends Controller {
  @action
  async createAccount () {
    const account = this.get ('store').createRecord ('account', {username: this.username, password: this.password, email: this.email});
    const adapterOptions = {signIn: true};
      
    await account.save ({adapterOptions});

    // You can transition to a protected application route
  }
}
```

The `save()` method takes an optional `adapterOptions` property that allows you to 
sign in the user when the account is created. The advantage of doing this it that 
it allows you to transition to a protected application route after account creation,
or access [protected data](#accessing-protected-data) as part of the creation process.
Otherwise, the user will have to sign in after creating the account to access a
protected application route.

Happy Coding!
