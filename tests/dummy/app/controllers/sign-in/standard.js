import Controller from '@ember/controller';
import { SignInControllerMixin } from 'ember-cli-gatekeeper';

export default Controller.extend (SignInControllerMixin, {
  signInOptions: null,

  init () {
    this._super (...arguments);

    this.set ('signInOptions', {
      client_id: '58ed90e1105aee00001e429f',
      client_secret: 'gatekeeper-android'
    });
  }
});
