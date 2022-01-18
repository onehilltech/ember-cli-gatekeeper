import Component from '@glimmer/component';
import { inject as service } from '@ember/service';

export default class GatekeeperAccountVerifiedComponent extends Component {
  @service
  session;

  get verified () {
    return this.session.currentUser.verified;
  }
}
