import Controller from '@ember/controller';
import Completed  from 'ember-cli-gatekeeper/mixins/completed';

export default Controller.extend (Completed, {
  init () {
    this._super (...arguments);

    this.set ('signUpOptions', {
      client_id: '58ed90e1105aee00001e429f',
      client_secret: 'gatekeeper-android'
    });
  }
});
