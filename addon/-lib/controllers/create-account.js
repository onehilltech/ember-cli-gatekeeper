import Ember from 'ember';

export default Ember.Controller.extend ({
  // Allow email, username, and password bindings (e.g., [email:emailAddress
  actions: {
    createAccount () {
      let {emailBinding, usernameBinding, passwordBinding, autoSignIn} =
        this.getProperties (['usernameBinding', 'passwordBinding', 'emailBinding', 'autoSignIn']);

      let email = this.get (emailBinding);
      let username = this.get (usernameBinding);
      let password = this.get (passwordBinding);

      let account = this.get ('store').createRecord ('account', {username, password, email});
      let adapterOptions = {};

      if (autoSignIn) {
        adapterOptions.signIn = true;
      }

      account.save ({adapterOptions}).then (account => {
        return this.didSignIn (account);
      }).catch (reason => {
        return this.didError (reason);
      });
    }
  }
});
