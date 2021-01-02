import Route from '@ember/routing/route';

export default class SignInStandardRoute extends Route {
  setupController (controller) {
    super.setupController (...arguments);

    controller.signInOptions = {
      client_id: '58ed90e1105aee00001e429f',
      client_secret: 'gatekeeper-android'
    }
  }
}
