import Component from '@glimmer/component';
import { action } from '@ember/object';
import { inject as service } from '@ember/service';
import { tracked } from "@glimmer/tracking";
import { isPresent } from '@ember/utils';

export default class GatekeeperAccountVerifiedComponent extends Component {
  @service
  session;

  @tracked
  account;

  get verified () {
    return isPresent (this.account) && this.account.verified;
  }

  @action
  async didInsert () {
    this.account = await this.session.me ();
  }
}
