import Controller from '@ember/controller';
import Completed  from 'ember-cli-gatekeeper/mixins/completed';

export default Controller.extend (Completed, {
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
