import Controller from '@ember/controller';

export default Controller.extend({
  actions: {
    createAccount () {
      let {username, password, email} = this.getProperties (['username', 'password', 'email']);
      let account = this.get ('store').createRecord ('account', {username, password, email});

      account.save ().then (() => {

      });
    }
  }
});
