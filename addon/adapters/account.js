import RESTAdapter from '../-lib/user/adapters/rest';

import { isPresent, isEmpty } from '@ember/utils';
import { getWithDefault } from '@ember/object';
import { readOnly } from '@ember/object/computed';

/**
 * @class AccountRESTAdapter
 *
 * The RESTAdapter for the account model.
 */
export default RESTAdapter.extend({
  /// Get the host from the base url for the client.
  host: readOnly ('session.gatekeeper.baseUrl'),

  createRecord (store, type, snapshot) {
    let _super = this._super;
    let adapter = this;
    let { adapterOptions } = snapshot;
    let opts = {};

    if (isPresent (Object.keys (adapterOptions))) {
      Object.assign (opts, adapterOptions);

      if (opts.signIn) {
        delete opts.signIn;
      }
    }

    // There is a chance that we are creating an account for one that already exists. We need
    // to remove the account that matches this email address from our cache. Otherwise, if we
    // do create an account from an existing email address that we have cached on the device,
    // this request will fail.

    const email = snapshot.attr ('email');
    const account = store.peekAll ('account').find (account => account.email === email);

    if (isPresent (account)) {
      if (!account.isSaving) {
        account.unloadRecord ();
      }
    }

    return this.get ('session.gatekeeper').authenticate (opts).then (() => {
      return _super.call (adapter, store, type, snapshot);
    });
  },

  urlForCreateRecord (modelName, snapshot) {
    let url = this._super (...arguments);

    let signIn = getWithDefault (snapshot, 'adapterOptions.signIn', false);

    if (signIn) {
      url += '?login=true';
    }

    return url;
  },

  urlForQueryRecord (query, modelName) {
    return isEmpty (Object.keys (query)) ? this.buildURL (modelName, 'me', null, 'findRecord', null) : this._super (...arguments);
  },

  ajaxOptions (url /*, type, options*/) {
    let hash = this._super (...arguments);
    let beforeSend = hash.beforeSend || function (/*xhr*/) { };

    hash.beforeSend = function (xhr) {
      // Call the original beforeSend() function.
      beforeSend (xhr);

      if (endsWith (url, '/me')) {
        // For request about the current account, we do not want to cache the response.
        // Otherwise, we run the risk of caching data related to a different user.
        xhr.setRequestHeader ('Cache-Control', 'no-cache, no-store, must-revalidate');
      }
    };

    return hash;
  },

  handleResponse (status, headers, payload, requestData) {
    if (status === 200 && requestData.method === 'POST') {
      let accessToken = payload.token;

      if (isPresent (accessToken)) {
        // Delete the access token from the payload.
        delete payload.token;

        // The account was created and logged in at the same time. We need to
        // extract the token, and register it with the gatekeeper service.
        let session = this.get ('session');
        let currentUser = {id: payload.account._id, username: payload.account.username, email: payload.account.email};

        session.setProperties ({currentUser, accessToken});
      }
    }

    return this._super (status, headers, payload, requestData);
  }
});

//From http://stackoverflow.com/questions/280634/endswith-in-javascript
function endsWith (string, suffix) {
  if (typeof String.prototype.endsWith !== 'function') {
    return string.indexOf(suffix, string.length - suffix.length) !== -1;
  } else {
    return string.endsWith(suffix);
  }
}