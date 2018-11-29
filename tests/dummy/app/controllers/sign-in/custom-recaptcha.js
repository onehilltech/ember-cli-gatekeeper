import Controller from '@ember/controller';
import Completed  from 'ember-cli-gatekeeper/mixins/completed';

export default Controller.extend (Completed, {
  signInOptions: null,

  init () {
    this._super (...arguments);

    this.set ('signInOptions', {
      client_id: '5a206991201dc8357e45d174'
    });
  }
});
