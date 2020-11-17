import Helper from '@ember/component/helper';

import { inject as service } from '@ember/service';
import { isPresent } from '@ember/utils';

export default class ProtectedUrlHelper extends Helper {
  @service
  session;

  compute([url], { baseUrl }) {
    if (isPresent (baseUrl) && !url.startsWith (baseUrl)) {
      return url;
    }

    let accessToken = this.session.isSignedIn ? this.session.accessToken : this.session.gatekeeper.accessToken;
    return `${url}?access_token=${accessToken.toString ()}`;
  }
}