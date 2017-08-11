import Ember from 'ember';
import RESTAdapter from '../-lib/user/adapters/rest';

export default RESTAdapter.extend({
  gatekeeper: Ember.inject.service (),

  userToken: Ember.computed.readOnly ('gatekeeper.accessToken'),

  clientToken: Ember.computed.readOnly ('gatekeeper.client.accessToken'),

  /**
   * Create a new account record.
   *
   * @param store
   * @param type
   * @param snapshot
   */
  createRecord (store, type, snapshot) {
    let _super = this._super;
    let adapter = this;

    return this._requestClientToken (snapshot).then (() => {
      return _super.call (adapter, store, type, snapshot);
    });
  },

  queryRecord (store, type, query) {
    if (Ember.isPresent (query)) {
      let url = this.buildURL (type.modelName, 'me', null, 'findRecord', null);
      return this.ajax (url, 'GET', null);
    }
    else {
      return this._super (...arguments);
    }
  },

  /**
   * Get the headers for the request.
   *
   * @param params
   */
  headersForRequest (params) {
    let headers = this._super (...arguments) || {};
    let token = params.requestType !== 'createRecord' ? this.get ('userToken') : this.get ('clientToken');
    headers['Authorization'] = `Bearer ${token}`;

    return headers;
  },

  /**
   * Compute the AJAX options for the request.
   *
   * @param url
   * @param type
   * @param options
   */
  ajaxOptions (url, type, options) {
    options = options || {};
    options.headers = options.headers || {};

    let token = type !== 'POST' ? this.get ('userToken'): this.get ('clientToken');
    options.headers['Authorization'] = `Bearer ${token}`;

    return this._super (url, type, options);
  },

  _requestClientToken (snapshot) {
    let clientOptions = Ember.getWithDefault (snapshot, 'adapterOptions.clientOptions', {});
    return this.get ('gatekeeper.client').authenticate (clientOptions);
  }
});
