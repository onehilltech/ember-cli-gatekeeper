import Controller from '@ember/controller';
import supports  from 'ember-cli-gatekeeper/supports';
import { alias } from '@ember/object/computed';

export default Controller.extend({
  metadata: alias ('session.metadata'),

  supportsCreateAccount: supports ('gatekeeper.account.create'),

  tempSession: null,

  actions: {
    authenticate () {
      const {password, session } = this;

      session.authenticate (password)
        .then (result => {
          if (result) {
            this.snackbar ({message: 'We authenticated the user.'});
            this.set ('snackbar', null);
          }
        })
        .catch (res => this.snackbar ({message: res.responseText}));
    },

    createTempSession () {
      this.session.createTempSession ({name: 'John Doe'}, { expiration: '10 minutes', audience: 'temp'})
        .then (this.set.bind (this, 'tempSession'));
    },

    endTempSession () {
      this.tempSession.signOut ()
        .then (result => {
          if (result) {
            this.set ('tempSession', null);
          }
        });
    }
  }
});
