import Controller from '@ember/controller';

import { action } from '@ember/object';
import { alias } from '@ember/object/computed';
import { tracked } from "@glimmer/tracking";

import supports  from 'ember-cli-gatekeeper/supports';

export default class AuthenticatedController extends Controller {
  @alias ('session.accessToken')
  metadata;

  @supports ('gatekeeper.account.create')
  supportsCreateAccount;

  @tracked
  tempSession;

  @action
  async signOut () {
    const result = await this.session.signOut (true);

    if (result) {
      this.transitionToRoute ('sign-in');
    }
  }

  @action
  async authenticate () {
    const { password, session } = this;

    try {
      const result = await session.authenticate (password);

      if (result) {
        this.snackbar.show ({message: 'We authenticated the user.'});
      }
      else {
        this.snackbar.show ({message: 'The password is incorrect.', dismiss: true});
      }
    }
    catch (err) {
      this.snackbar.showError (err);
    }
  }

  @action
  async createTempSession () {
    try {
      this.tempSession = await this.session.createTempSession ({name: 'John Doe'}, { expiration: '10 minutes', audience: 'temp'});
    }
    catch (err) {
      this.snackbar.showError (err);
    }
  }

  @action
  async endTempSession () {
    const result = await this.tempSession.signOut ();

    if (result) {
      this.tempSession = null;
    }
  }

  @action
  async verifyToken () {
    const accessToken = this.session.accessToken;
    const verified = await this.session.gatekeeper.verifyToken (accessToken.toString (), null, null, true);

    if (verified) {
      this.snackbar.show ({message: 'We verified your access token.'});
    }
    else {
      this.snackbar.show ({message: 'We could not verify your access token.'});
    }
  }
}
