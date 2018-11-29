import Controller from '@ember/controller';
import Completed  from 'ember-cli-gatekeeper/mixins/completed';

export default Controller.extend (Completed, {
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
