import Ember from 'ember';
import RSVP from 'rsvp';

export default Ember.Service.extend({
  client : Ember.inject.service ('gatekeeper-client'),
  storage: Ember.inject.service ('local-storage'),
  store  : Ember.inject.service (),

  /// [private] The current authenticated user.
  _currentUser: Ember.computed.alias ('storage.gatekeeper_user'),

  /// [private] Token for the current user.
  _userToken  : Ember.computed.alias ('storage.gatekeeper_user_token'),

  /// The current authenticated user.
  currentUser: Ember.computed.readOnly ('storage.gatekeeper_user'),
  accessToken: Ember.computed.readOnly ('_userToken.access_token'),

  isSignedOut: Ember.computed.none ('_userToken'),

  isSignedIn: Ember.computed.not ('isSignedOut'),

  /**
   * Force the current user to sign out. This does not communicate the sign out
   * request to the server.
   */
  forceSignOut () {
    this.setProperties ({_userToken: null, _currentUser: null});
  },

  /**
   * Sign in the user.
   *
   * @returns {*}
   */
  signIn (opts) {
    return new RSVP.Promise ((resolve, reject) => {
      const tokenOptions = Ember.merge ({grant_type: 'password'}, opts);

      this._getToken (tokenOptions).then ((token) => {
        this.set ('_userToken', token);

        // Query the service for the current user. We are going to cache their id
        // just in case the application needs to use it.
        this.get ('store').queryRecord ('account', {}).then ((account) => {
          this.set ('_currentUser', account.toJSON ({includeId: true}));
          this._completeSignIn ();

          Ember.run (null, resolve);
        }).catch ((reason) => {
          this.set ('_userToken');
          Ember.run (null, reject, reason);
        });
      }).catch (reject);
    });
  },

  /**
   * Sign out of the service.
   *
   * @returns {RSVP.Promise|*}
   */
  signOut () {
    let self = this;

    return new RSVP.Promise ((resolve, reject) => {
      const url = this.computeUrl ('/oauth2/logout');

      const ajaxOptions = {
        type: 'POST',
        url: url,
        cache: false,
        headers: this.get ('_httpHeaders'),

        success (result) {
          if (result) {
            self._completeSignOut ();
            Ember.run (null, resolve);
          }
          else {
            Ember.run (null, reject);
          }
        },

        error (xhr) {
          if (xhr.status === 401) {
            // The token is bad. Try to refresh the token, then attempt to sign out the
            // user again in a graceful manner.
            self.refreshToken ()
              .then (() => { return self.signOut (); })
              .then (resolve)
              .catch (reject);
          }
          else {
            Ember.run (null, reject);
          }
        }
      };

      Ember.$.ajax (ajaxOptions);
    });
  },

  /**
   * Manually refresh the access token for the current user.
   *
   * @returns {*|RSVP.Promise}
   */
  refreshToken () {
    return new RSVP.Promise ((resolve, reject) => {
      const tokenOptions = {
        grant_type: 'refresh_token',
        refresh_token: this.get ('_userToken.refresh_token')
      };

      this._getToken (tokenOptions).then ((token) => {
        // Replace the current user token with this new token, and resolve.
        this.set ('_userToken', token);

        Ember.run (null, resolve);
      }).catch ((xhr) => {
        // Reset the state of the service. The client, if observing the sign in
        // state of the user, should show the authentication form.
        this.forceSignOut ();

        // Run the reject method.
        Ember.run (null, reject, xhr);
      });
    });
  },

  _httpHeaders: Ember.computed ('_userToken', function () {
    return {
      'Authorization': `Bearer ${this.get ('_userToken.access_token')}`
    }
  }),

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
            // Use the Gatekeeper service to refresh the token. If the token is refreshed,
            // then retry the original request. Otherwise, pass the original error to the
            // back to the client.
            this.refreshToken ()
              .then (() => {
                this._ajax (dupOptions);
              })
              .catch ((xhr, textStatus, error) => {
                this.forceSignOut ();
                Ember.run (null, reject, {xhr: xhr, status: textStatus, error: error});
              });
            break;

          case 403:
            this.forceSignOut ();
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

  _ajax (ajaxOptions) {
    ajaxOptions.headers = ajaxOptions.headers || {};
    ajaxOptions.headers.Authorization = `Bearer ${this.get ('_userToken.access_token')}`;

    Ember.$.ajax (ajaxOptions);
  },

  /**
   * Change the current password for the user.
   *
   * @param currentPassword
   * @param newPassword
   */
  changePassword (currentPassword, newPassword) {
    const url =  this.computeUrl ('/accounts/me/password');
    const data = {
      'change-password': {
        current: currentPassword,
        new: newPassword
      }
    };

    const ajaxOptions = {
      method: 'POST',
      url: url,
      data: JSON.stringify (data),
      dataType: 'json',
      contentType: 'application/json',
    };

    return this.ajax (ajaxOptions);
  },

  computeUrl (relativeUrl) {
    return this.get ('client').computeUrl (relativeUrl);
  },

  /**
   * Private method for requesting an access token from the server.
   *
   * @param opts
   * @returns {RSVP.Promise}
   * @private
   */
  _getToken (opts) {
    return new RSVP.Promise ((resolve, reject) => {
      const url = this.computeUrl ('/oauth2/token');

      const data = Ember.merge ({
        client_id: this.get ('client.clientId'),
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

  /**
   * Complete the sign in process.
   *
   * @param resolve
   * @private
   */
  _completeSignIn () {
    Ember.sendEvent (this, 'signedIn');
  },

  /**
   * Complete the sign out process.
   *
   * @private
   */
  _completeSignOut () {
    this.forceSignOut ();
    Ember.sendEvent (this, 'signedOut');
  }
});
