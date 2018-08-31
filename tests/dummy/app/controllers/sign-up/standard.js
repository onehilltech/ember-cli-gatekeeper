import Controller from '@ember/controller';
import { SignUpControllerMixin } from 'ember-cli-gatekeeper';

export default Controller.extend (SignUpControllerMixin, {
  init () {
    this._super (...arguments);

    this.set ('signUpOptions', {
      client_id: '58ed90e1105aee00001e429f',
      client_secret: 'gatekeeper-android'
    });
  }
});
