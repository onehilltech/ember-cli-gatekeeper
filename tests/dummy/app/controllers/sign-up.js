import Controller from '@ember/controller';

export default Controller.extend({
  actions: {
    accountCreated (account) {
      let message = `Created account for ${account.get ('username')}`;
      this.set ('messageToUser', message);
    }
  }
});
