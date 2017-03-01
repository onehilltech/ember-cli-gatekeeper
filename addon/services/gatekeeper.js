import Ember from 'ember';
import ENV from 'malachi-dashboard/config/environment';

const versionedUrl = ENV.gatekeeper.baseURL + '/v' + ENV.gatekeeper.version;
const tokenUrl = versionedUrl + '/oauth2/token';

export default Ember.Service.extend({
  storage: Ember.inject.service ('storage'),

  /**
   * Reset the state of the service.
   */
  reset () {
    this.set ('storage.accessToken');
    this.set ('storage.refreshToken');
  },

  /**
   * Test if a user is signed into an account.
   *
   * @returns {boolean}
   */
  isSignedIn () {
    const accessToken = this.get ('storage.accessToken');
    return !Ember.isNone (accessToken);
  },

  /**
   * Sign in to the service.
   *
   * @returns {*}
   */
  signIn (opts) {
    let self = this;

    let data = {
      grant_type: 'password',
      client_id: ENV.gatekeeper.clientId,
      username: opts.username,
      password: opts.password
    };

    return new Ember.RSVP.Promise (function (resolve, reject) {
      Ember.$.ajax ({
        type: 'POST',
        url: tokenUrl,
        cache: false,
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify (data),
        success (data) {
          self.set ('storage.accessToken', data.access_token);
          self.set ('storage.refreshToken', data.refresh_token);

          resolve ()
        },
        error: reject
      });
    });
  },

  /**
   * Sign out of the service.
   *
   * @returns {RSVP.Promise|*}
   */
  signOut () {
    const url = versionedUrl + '/oauth2/logout';

    let self = this;
    let accessToken = this.get ('storage.accessToken');

    return new Ember.RSVP.Promise (function (resolve, reject) {
      Ember.$.ajax ({
        type: 'POST',
        url: url,
        cache: false,
        headers: {
          'Authorization': 'Bearer ' + accessToken,
        },
        success () {
          // Reset the state of the service, then mark the promise as resolved.
          self.reset ();
          resolve ();
        },
        error (xhr) {
          if (xhr.status === 401) {
            // The token is bad. Try to refresh the token, then attempt to sign out the
            // user again in a graceful manner.
            self.refreshToken ()
              .then (function () { return self.signOut (); })
              .then (function () { resolve (); })
              .catch (reject);
          }
          else {
            // Force a reset, then mark the promise as resolved.
            self.reset ();
            resolve ();
          }
        }
      });
    });
  },

  /**
   * Manually refresh the access token for the current user.
   *
   * @returns {*|RSVP.Promise}
   */
  refreshToken () {
    let self = this;

    return new Ember.RSVP.Promise (function (resolve, reject) {
      const data = {
        grant_type: 'refresh_token',
        client_id: ENV.gatekeeper.clientId,
        refresh_token: self.get ('storage.refreshToken')
      };

      let refreshOptions = {
        method: 'POST',
        url: tokenUrl,
        cache: false,
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify (data),
        success: function (data) {
          // Store both the access token and the refresh token.
          self.set ('storage.accessToken', data.access_token);
          self.set ('storage.refreshToken', data.refresh_token);

          // The promise has been resolved.
          resolve ();
        },
        error: reject
      };

      Ember.$.ajax (refreshOptions);
    });
  },

  /**
   * Get a client token.
   *
   * @returns {RSVP.Promise|*}
   */
  getClientToken () {
    return new Ember.RSVP.Promise (function (resolve, reject) {
      const data = {
        grant_type: 'client_credentials',
        client_id: ENV.gatekeeper.clientId
      };

      Ember.$.ajax ({
        method: 'POST',
        url: tokenUrl,
        cache: false,
        dataType: 'json',
        contentType: 'application/json',
        data: JSON.stringify (data),
        success: function (res) {
          resolve (res);
        },
        error: reject
      });
    });
  },

  /**
   * Create a new account.
   *
   * @param opts
   * @returns {*|RSVP.Promise}
   */
  createAccount (opts) {
    let gatekeeper = this;

    return new Ember.RSVP.Promise (function (resolve, reject) {
      gatekeeper.getClientToken ()
        .then (function (clientToken) {
          const account = {
            username: opts.username,
            password: opts.password,
            email: opts.email
          };

          Ember.$.ajax ({
            method: 'POST',
            url: versionedUrl + '/accounts',
            cache: false,
            dataType: 'json',
            contentType: 'application/json',
            data: JSON.stringify ({account: account}),
            headers: {
              'Authorization': 'Bearer ' + clientToken.access_token
            },
            success: resolve,
            error: reject
          });
        })
        .catch (reject);
    });
  },

  /**
   * Send an authorized AJAX request for the current user. The authorization
   * header will be added to the original request.
   *
   * @param ajaxOptions
   */
  ajax (ajaxOptions) {
    let gatekeeper = this;
    let dupOptions = this._duplicateAjaxOptions (ajaxOptions);

    return new Ember.RSVP.Promise ((resolve, reject) => {
      dupOptions.success = function (payload, textStatus, jqXHR) {
        Ember.run (null, resolve, {payload: payload, status: textStatus, xhr: jqXHR});
      };

      dupOptions.error = function (xhr, textStatus, errorThrown) {
        if (xhr.status !== 401) {
          Ember.run (null, reject, {xhr: xhr, status: textStatus, error: errorThrown});
        }

        // Use the Gatekeeper service to refresh the token. If the token is refreshed,
        // then retry the original request. Otherwise, pass the original error to the
        // back to the client.
        gatekeeper.refreshToken ()
          .then (function () {
            gatekeeper._ajaxRequest (dupOptions);
          })
          .catch (function (xhr, textStatus, error) {
            // We failed to refresh the token.
            Ember.run (null, reject, {xhr: xhr, status: textStatus, error: error});
          });
      };

      gatekeeper._ajaxRequest (dupOptions);
    });
  },

  _ajaxRequest (ajaxOptions) {
    const accessToken = this.get ('storage.accessToken');
    ajaxOptions.headers = ajaxOptions.headers || {};
    ajaxOptions.headers.Authorization = 'Bearer ' + accessToken;

    Ember.$.ajax (ajaxOptions);
  },

  _duplicateAjaxOptions (ajaxOptions) {
    return {
      type: ajaxOptions.type,
      url: ajaxOptions.url,
      dataType: ajaxOptions.dataType,
      context: this,
      contentType: ajaxOptions.contentType,
      data: ajaxOptions.data,
      headers: ajaxOptions.headers,
      beforeSend: ajaxOptions.beforeSend
    };
  }
});
