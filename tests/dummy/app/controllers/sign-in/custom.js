import Controller from '@ember/controller';

export default Controller.extend ({
  signInOptions: null,

  init () {
    this._super (...arguments);

    // The signInOptions is not required unless you are overriding the default
    // sign in options defined in config/environment.js. We are only doing it
    // here because we need to test different versions of the sign in component 
    // the dummy test application.

    this.set ('signInOptions', {
      client_id: '58ed90e1105aee00001e429f',
      client_secret: 'gatekeeper-android'
    });
  }
});
