import Controller from '@ember/controller';

export default Controller.extend ({
  signInOptions: null,

  requirements: Object.freeze ([
    {description: 'Must be 8 characters or longer', pattern: /[\w\W]{8,}/},
    {description: 'Must have at least 1 lowercase letter', pattern: /[a-z]+/},
  ]),

  init () {
    this._super (...arguments);

    this.set ('signInOptions', {
      client_id: '5a206991201dc8357e45d174'
    });
  }
});
