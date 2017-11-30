import Ember from 'ember';
import ReCaptcha from './recaptcha';

export default Ember.Mixin.create (Ember.Evented, ReCaptcha, {
  store: Ember.inject.service (),

  canSubmit: true,

  actions: {
    createAccount () {
      // Reset the current error message.
      this.set ('errorMessage');

      let recaptcha = this.get ('recaptcha');

      if (Ember.isPresent (recaptcha) && Ember.isEmpty (recaptcha.get ('value'))) {
        recaptcha.set ('reset', true);
      }
      else {
        this._doSubmit ();
      }
    }
  },

  _doSubmit () {
    let {
      username,
      password,
      email,
      recaptcha,
      autoSignIn
    } = this.getProperties (['username','password','email','recaptcha', 'autoSignIn']);

    let adapterOptions = {};

    if (autoSignIn) {
      adapterOptions.signIn = true;
    }

    if (Ember.isPresent (recaptcha)) {
      adapterOptions.recaptcha = recaptcha.get ('value');
    }

    let account = this.get ('store').createRecord ('account', {username, password, email});

    this.trigger ('willCreateAccount');

    account.save ({adapterOptions}).then ((account) => {
      this.trigger ('didCreateAccount', account);
    }).catch (xhr => {
      this.trigger ('error', xhr);
    });
  }
});
