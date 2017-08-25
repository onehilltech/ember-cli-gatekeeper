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

  /**
   * Query a single record.
   *
   * @param store
   * @param type
   * @param query
   * @returns {*|Promise}
   */
  queryRecord (store, type, query) {
    if (Ember.isPresent (query)) {
      let url = this.buildURL (type.modelName, 'me', null, 'findRecord', null);
      let options = {cache: false};

      return this.ajax (url, 'GET', options);
    }
    else {
      return this._super (...arguments);
    }
  },

  _requestClientToken (snapshot) {
    let clientOptions = Ember.getWithDefault (snapshot, 'adapterOptions.clientOptions', {});
    return this.get ('gatekeeper.client').authenticate (clientOptions);
  }
});
