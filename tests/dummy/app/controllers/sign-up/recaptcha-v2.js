import Controller from '@ember/controller';
import { SignUpControllerMixin } from 'ember-cli-gatekeeper';

export default Controller.extend (SignUpControllerMixin, {
  init () {
    this._super (...arguments);

    this.set ('signUpOptions', {
      client_id: '5a206991201dc8357e45d174',
    });
  }
});
