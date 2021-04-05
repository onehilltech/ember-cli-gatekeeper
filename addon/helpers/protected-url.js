import Helper from '@ember/component/helper';
import { inject as service } from '@ember/service';

export default class ProtectedUrlHelper extends Helper {
  @service
  session;

  compute([url], { baseUrl }) {
    return this.session.protectUrl (url, baseUrl);
  }
}