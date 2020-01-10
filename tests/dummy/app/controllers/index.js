import Controller from '@ember/controller';
import supports  from 'ember-cli-gatekeeper/supports';
import { alias } from '@ember/object/computed';

export default Controller.extend({
  metadata: alias ('session.metadata'),

  supportsCreateAccount: supports ('gatekeeper.account.create'),

  actions: {
    authenticate () {
      const {password, session } = this.getProperties (['password', 'session']);

      session.authenticate (password)
        .then (result => {
          if (result) {
            this.snackbar ({message: 'We authenticated the user.'});
            this.set ('snackbar', null);
          }
        })
        .catch (res => this.snackbar ({message: res.responseText}));
    }
  }
});
