import Route from '@ember/routing/route';

export default class SignUpStandardRoute extends Route {
  setupController (controller) {
    super.setupController (...arguments);

    controller.signUpOptions = {
      client_id: '58ed90e1105aee00001e429f',
      client_secret: 'gatekeeper-android'
    }
  }
}
