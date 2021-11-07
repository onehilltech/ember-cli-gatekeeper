import RESTAdapter from '@ember-data/adapter/rest';

import { isPresent, isEmpty } from '@ember/utils';
import { getWithDefault } from '@ember/object';
import bearer from '../-lib/bearer';

/**
 * @class AccountRESTAdapter
 *
 * The RESTAdapter for the account model.
 */
@bearer
export default class AccountRESTAdapter extends RESTAdapter {
  get host () {
    return this.session.gatekeeper.baseUrl;
  }

  createRecord (store, type, snapshot) {
    let { adapterOptions } = snapshot;
    let opts = {};

    if (isPresent (Object.keys (adapterOptions))) {
      Object.assign (opts, adapterOptions);

      if (isPresent (opts.signIn)) {
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

    return super.createRecord (store, type, snapshot);
  }

  urlForCreateRecord (modelName, snapshot) {
    let url = super.urlForCreateRecord (...arguments);
    let signIn = getWithDefault (snapshot, 'adapterOptions.signIn', false);

    if (signIn) {
      url += '?login=true';
    }

    return url;
  }

  urlForQueryRecord (query, modelName) {
    if (isEmpty (Object.keys (query))) {
      return this.buildURL (modelName, 'me', null, 'findRecord', null);
    }
    else {
      return super.urlForQueryRecord (...arguments);
    }
  }

  ajaxOptions (url) {
    let hash = super.ajaxOptions (...arguments);
    let beforeSend = hash.beforeSend || function () { };

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
  }

  handleResponse (status, headers, payload, requestData) {
    if (status === 200 && requestData.method === 'POST') {
      let accessToken = payload.token;

      if (isPresent (accessToken)) {
        // Delete the access token from the payload.
        delete payload.token;


        // The account was created and logged in at the same time. We need to
        // extract the token, and register it with the gatekeeper service.
        this.session._updateTokens (accessToken.access_token, accessToken.refresh_token);
        this.session.currentUser = {id: payload.account._id, username: payload.account.username, email: payload.account.email};
      }
    }

    return super.handleResponse (status, headers, payload, requestData);
  }
}

//From http://stackoverflow.com/questions/280634/endswith-in-javascript
function endsWith (string, suffix) {
  if (typeof String.prototype.endsWith !== 'function') {
    return string.indexOf(suffix, string.length - suffix.length) !== -1;
  } else {
    return string.endsWith(suffix);
  }
}