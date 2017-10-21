import Ember from 'ember';
import RESTAdapter from '../-lib/user/adapters/rest';

/**
 * @class AccountRESTAdapter
 *
 * The RESTAdapter for the account model.
 */
export default RESTAdapter.extend({
  createRecord (store, type, snapshot) {
    let _super = this._super;
    let adapter = this;

    return this.get ('gatekeeper.client').authenticate ().then (() => {
      return _super.call (adapter, store, type, snapshot);
    });
  },

  headersForRequest (params) {
    let {id, requestType} = params;
    let headers = this._super (...arguments);

    switch (requestType) {
      case 'createRecord': {
        // When creating an account record, we need to submit the client token, and not
        // the user token. This is because we assume accounts are being created when the
        // user is not signed in (i.e., by the client device).
        let accessToken = this.get ('gatekeeper.client.accessToken');
        headers.Authorization = `Bearer ${accessToken.access_token}`;
        break;
      }

      case 'findRecord': {
        if (id === 'me') {
          // 'me' is shorthand for the current user without knowing the current user's
          // id. We cannot cache this request, and must always go back to the server for
          // the response to this request since the user could change.
          headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
        }
        break;
      }
    }

    return headers;
  }
});
