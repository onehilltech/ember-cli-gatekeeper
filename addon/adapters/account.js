import RESTAdapter from '../-lib/user/adapters/rest';
import Ember from 'ember';

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

  urlForRequest(params) {
    let { type, snapshot, requestType, query } = params;

    // type and id are not passed from updateRecord and deleteRecord, hence they
    // are defined if not set
    type = type || (snapshot && snapshot.type);

    switch (requestType) {
      case 'createRecord': {
        let url = this._super (...arguments);
        let signIn = Ember.getWithDefault (snapshot, 'adapterOptions.signIn', false);

        if (signIn) {
          url += '?login=true';
        }

        return url;
      }

      case 'queryRecord':
        if (Ember.isEmpty (Object.keys (query))) {
          return this.buildURL (type.modelName, 'me', null, 'findRecord', null);
        }

        break;
    }

    return this._super (...arguments);
  },

  headersForRequest (params) {
    let {id, requestType, query} = params;
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

      case 'queryRecord': {
        if (Ember.isEmpty (Object.keys (query))) {
          // The empty query object is shorthand for the current user without knowing the
          // current user's id. We cannot cache this request, and must always go back to
          // the server for the response to this request since the user could change.
          headers['Cache-Control'] = 'no-cache, no-store, must-revalidate';
        }
        break;
      }
    }

    return headers;
  },

  handleResponse (status, headers, payload, requestData) {
    let token = payload.token;
    if (token) delete payload.token;

    if (status === 200 && requestData.method === 'POST' && token) {
      // The account was created and logged in at the same time. We need to
      // extract the token, and register it with the gatekeeper service.

      let gatekeeper = this.get ('gatekeeper');
      let currentUser = {id: payload.account._id, username: payload.account.username, email: payload.account.email};

      gatekeeper.setProperties ({_currentUser: currentUser, _accessToken: token});
    }

    return this._super (status, headers, payload, requestData);
  }
});
