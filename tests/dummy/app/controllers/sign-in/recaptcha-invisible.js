import Controller from '@ember/controller';
import { SignInControllerMixin } from 'ember-cli-gatekeeper';

export default Controller.extend (SignInControllerMixin, {
  signInOptions: null,

  init () {
    this._super (...arguments);

    this.set ('signInOptions', {
      client_id: '5a206991201dc8357e45d174'
    });
  }
});
