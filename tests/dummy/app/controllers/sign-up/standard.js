import Controller from '@ember/controller';
import Completed  from 'ember-cli-gatekeeper/mixins/completed';

export default Controller.extend (Completed, {
  requirements: Object.freeze ([
    {description: 'Must be 8 characters or longer', pattern: /[\w\W]{8,}/},
    {description: 'Must have at least 1 lowercase letter', pattern: /[a-z]+/},
  ]),

  init () {
    this._super (...arguments);

    this.set ('signUpOptions', {
      client_id: '58ed90e1105aee00001e429f',
      client_secret: 'gatekeeper-android'
    });
  }
});
