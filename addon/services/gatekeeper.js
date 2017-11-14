import Ember from 'ember';
import RSVP from 'rsvp';

export default Ember.Service.extend (Ember.Evented, {
  client: Ember.inject.service ('gatekeeper-client'),

  storage: Ember.inject.service ('local-storage'),

  store: Ember.inject.service (),

  /// [private] The current authenticated user.
  _currentUser: Ember.computed.alias ('storage.gatekeeper_user'),
  currentUser: Ember.computed.readOnly ('_currentUser'),

  /// [private] Token for the current user.
  _accessToken: Ember.computed.alias ('storage.gatekeeper_user_token'),
  accessToken: Ember.computed.readOnly ('_accessToken'),

  isSignedIn: Ember.computed.bool ('_accessToken'),
  isSignedOut: Ember.computed.not ('isSignedIn'),

  /**
   * Force the current user to sign out. This does not communicate the sign out
   * request to the server.
   */
  forceSignOut (reason) {
    this.setProperties ({_accessToken: null, _currentUser: null, errorMessage: reason});
  },

  /**
   * Sign in the user.
   *
   * The options provides by the client will be merged with the standard tokenOptions
   * from the gatekeeper configuration.
   *
   * @returns {*}
   */
  signIn (opts) {
    return new RSVP.Promise ((resolve, reject) => {
      const tokenOptions = Ember.merge ({grant_type: 'password'}, opts);

      this._getToken (tokenOptions).then (token => {
        this.set ('_accessToken', token);

        // Query the service for the current user. We are going to cache their id
        // just in case the application needs to use it.
        this.get ('store').queryRecord ('account', {}).then (account => {
          this.set ('_currentUser', account.toJSON ({includeId: true}));
          this._completeSignIn ();

          Ember.run (null, resolve);
        }).catch (reason => {
          this.set ('_accessToken');

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
        refresh_token: this.get ('_accessToken.refresh_token')
      };

      this._getToken (tokenOptions).then ((token) => {
        // Replace the current user token with this new token, and resolve.
        this.set ('_accessToken', token);

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

  _httpHeaders: Ember.computed ('_accessToken', function () {
    return {Authorization: `Bearer ${this.get ('accessToken.access_token')}`}
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
    ajaxOptions.headers.Authorization = `Bearer ${this.get ('accessToken.access_token')}`;

    Ember.$.ajax (ajaxOptions);
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
      const tokenOptions = this.get ('client.tokenOptions');
      const data = Ember.assign ({}, tokenOptions, opts);

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
    this.set ('errorMessage');
    this.trigger ('signedIn');
  },

  /**
   * Complete the sign out process.
   *
   * @private
   */
  _completeSignOut () {
    this.forceSignOut ();
    this.trigger ('signedOut');
  }
});
