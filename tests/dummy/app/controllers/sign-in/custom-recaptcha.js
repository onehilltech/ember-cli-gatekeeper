import Controller from '@ember/controller';

export default Controller.extend ({
  signInOptions: null,

  init () {
    this._super (...arguments);

    // The signInOptions is not required here. We are using it here because 
    // we are override the default configuration in config/environment.js.
    
    this.set ('signInOptions', {
      client_id: '5a206991201dc8357e45d174'
    });
  }
});
