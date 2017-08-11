import Ember from 'ember';
import RSVP from 'rsvp';

export default Ember.Service.extend({
  /// Reference to local storage.
  storage: Ember.inject.service ('local-storage'),

  _clientToken: Ember.computed.alias ('storage.gatekeeper_client_token'),

  accessToken: Ember.computed.readOnly ('_clientToken.access_token'),

  init () {
    this._super (...arguments);

    let ENV = Ember.getOwner (this).resolveRegistration ('config:environment');

    this.setProperties ({
      clientId: Ember.get (ENV, 'gatekeeper.clientId'),
      version: Ember.getWithDefault (ENV, 'gatekeeper.version', 1),
      baseUrl: Ember.get (ENV, 'gatekeeper.baseUrl')
    });
  },

  isUnauthenticated: Ember.computed.none ('_clientToken'),
  isAuthenticated: Ember.computed.not ('isUnauthenticated'),

  versionUrl: Ember.computed ('baseUrl', function () {
    return `${this.get ('baseUrl')}/v${this.get ('version')}`
  }),

  computeUrl (relativeUrl) {
    return `${this.get ('versionUrl')}${relativeUrl}`;
  },

  /**
   * Authenticate the client.
   *
   * @param opts
   */
  authenticate (opts) {
    return this._requestToken (opts).then ((token) => {
      this.set ('_clientToken', token);
    });
  },

  /**
   * Reset the state of the service.
   */
  reset () {
    this.set ('_clientToken');
  },

  /**
   * Send an authorized AJAX request for the current user. The authorization
   * header will be added to the original request.
   *
   * @param ajaxOptions
   */
  ajax (ajaxOptions) {
    return new RSVP.Promise ((resolve, reject) => {
      let dupOptions = Ember.copy (ajaxOptions, false);

      dupOptions.success = function (payload, textStatus, jqXHR) {
        Ember.run (null, resolve, {payload: payload, status: textStatus, xhr: jqXHR});
      };

      dupOptions.error = (xhr, textStatus, errorThrown) => {
        switch (xhr.status) {
          case 401:
          case 403:
            this.reset ();
            Ember.run (null, reject, {xhr: xhr, status: textStatus, error: errorThrown});
            break;

          default:
            Ember.run (null, reject, {xhr: xhr, status: textStatus, error: errorThrown});
        }
      };

      // Do the ajax operation.
      this._ajax (dupOptions);
    });
  },
  

  /**
   * Private method for requesting an access token from the server.
   *
   * @param opts
   * @returns {RSVP.Promise}
   * @private
   */
  _requestToken (opts) {
    return new RSVP.Promise ((resolve, reject) => {
      const url = this.computeUrl ('/oauth2/token');

      const data = Ember.merge ({
        grant_type: 'client_credentials',
        client_id: this.get ('clientId'),
      }, opts);

      const ajaxOptions = {
        method: 'POST',
        url: url,
        cache: false,
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify (data),
        success: resolve,
        error: reject
      };

      Ember.$.ajax (ajaxOptions);
    });
  },

  _ajax (ajaxOptions) {
    const accessToken = this.get ('_clientToken.access_token');

    ajaxOptions.headers = ajaxOptions.headers || {};
    ajaxOptions.headers.Authorization = 'Bearer ' + accessToken;

    Ember.$.ajax (ajaxOptions);
  }
});
