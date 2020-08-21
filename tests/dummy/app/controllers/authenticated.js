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
  tempSession = null;

  @action
  signOut () {
    this.session.signOut ().then (result => {
      if (result)
        this.transitionToRoute ('sign-in');
    });
  }

  @action
  authenticate () {
    const {password, session } = this;

    session.authenticate (password)
      .then (result => {
        if (result) {
          this.snackbar.show ({message: 'We authenticated the user.'});
          this.set ('snackbar', null);
        }
      })
      .catch (res => this.snackbar ({message: res.responseText}));
  }

  @action
  createTempSession () {
    this.session.createTempSession ({name: 'John Doe'}, { expiration: '10 minutes', audience: 'temp'})
      .then (this.set.bind (this, 'tempSession'))
      .catch (res => this.snackbar.show ({message: res.responseText}));
  }

  @action
  endTempSession () {
    this.tempSession.signOut ()
      .then (result => {
        if (result) {
          this.set ('tempSession', null);
        }
      });
  }
}
