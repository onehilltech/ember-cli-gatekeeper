import Ember from 'ember';

const STORAGE_CLIENT_TOKEN = 'storage.gatekeeper::clientToken';

export default Ember.Service.extend({
  init () {
    this._super (...arguments);
    this.set ('_clientToken', this.get (STORAGE_CLIENT_TOKEN));

    // Initialize the service from the APP configuration.
    const ENV = Ember.getOwner (this).resolveRegistration ('config:environment');
    this.set ('clientId', ENV.APP.gatekeeper.clientId);
    this.set ('baseUrl', ENV.APP.gatekeeper.baseURL + '/v' + ENV.APP.gatekeeper.version);
  },

  /**
   * Test if the client has been authenticated.
   */
  isAuthenticated: Ember.computed ('_clientToken', function () {
    return !Ember.isNone (this.get ('_clientToken'));
  }),

  /**
   * Authenticate the client.
   *
   * @param opts
   */
  authenticate (opts) {
    return Ember.RSVP.Promise ((resolve, reject) => {
      this._getToken (opts)
        .then ((token) => {
          // Store the client token internally, and in local storage.
          this.set (STORAGE_CLIENT_TOKEN, token);

          // Run the resolve method.
          Ember.run (null, resolve);
        })
        .catch (reject);
    });
  },

  /**
   * Reset the state of the service.
   */
  reset () {
    this.set ('_clientToken');
    this.set (STORAGE_CLIENT_TOKEN);
  },

  /**
   * Send an authorized AJAX request for the current user. The authorization
   * header will be added to the original request.
   *
   * @param ajaxOptions
   */
  ajax (ajaxOptions) {
    return new Ember.RSVP.Promise ((resolve, reject) => {
      let dupOptions = Ember.copy (ajaxOptions, false);

      dupOptions.success = function (payload, textStatus, jqXHR) {
        Ember.run (null, resolve, {payload: payload, status: textStatus, xhr: jqXHR});
      };

      dupOptions.error = (xhr, textStatus, errorThrown) => {
        switch (xhr.status) {
          case 401:
            // Use the Gatekeeper service to refresh the token. If the token is refreshed,
            // then retry the original request. Otherwise, pass the original error to the
            // back to the client.
            this.refreshToken ()
              .then (() => {
                this._ajax (dupOptions);
              })
              .catch ((xhr, textStatus, error) => {
                this.reset ();
                Ember.run (null, reject, {xhr: xhr, status: textStatus, error: error});
              });
            break;

          case 403:
            this.reset ();
            Ember.run (null, reject, {xhr: xhr, status: textStatus, error: errorThrown});
            break;

          default:
            Ember.run (null, reject, {xhr: xhr, status: textStatus, error: errorThrown});
        }
      };

      // Do the ajax operation.
      this._ajax (ajaxOptions);
    });
  },

  /**
   * Private method for requesting an access token from the server.
   *
   * @param opts
   * @returns {RSVP.Promise}
   * @private
   */
  _getToken (opts) {
    return new Ember.RSVP.Promise ((resolve, reject) => {
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
