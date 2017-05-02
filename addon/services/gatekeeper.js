import Ember from 'ember';

const STORAGE_USER_TOKEN = 'storage.gatekeeper::_userToken';
const STORAGE_CURRENT_USER = 'storage.gatekeeper::currentUser';

export default Ember.Service.extend({
  /// Reference to local storage.
  storage: Ember.inject.service (),

  /// Reference ot the Ember Data store.
  store: Ember.inject.service (),

  init () {
    this._super (...arguments);

    // Load the user token and the current user from local storage.
    this.set ('_userToken', this.get (STORAGE_USER_TOKEN));
    this.set ('currentUser', this.get (STORAGE_CURRENT_USER));

    // Initialize the service from the APP configuration.
    const ENV = Ember.getOwner (this).resolveRegistration ('config:environment');
    this.set ('clientId', ENV.APP.gatekeeper.clientId);
    this.set ('baseUrl', ENV.APP.gatekeeper.baseURL + '/v' + ENV.APP.gatekeeper.version);
  },

  /**
   * Get the id of the current user.
   */
  currentUser: Ember.computed.alias (STORAGE_CURRENT_USER),

  /**
   * Force the current user to sign out. This does not communicate the sign out
   * request to the server.
   */
  forceSignOut () {
    this._clearUserToken ();
    this._clearCurrentUser ();
  },

  /**
   * Sign in state for the current user.
   */
  isSignedIn: Ember.computed ('_userToken', function () {
    const accessToken = this.get ('_userToken');
    return !Ember.isNone (accessToken);
  }),

  /**
   * Sign out state for the current user.
   */
  isSignedOut: Ember.computed ('_userToken', function () {
    const accessToken = this.get ('_userToken');
    return Ember.isNone (accessToken);
  }),

  /**
   * Sign in the user.
   *
   * @returns {*}
   */
  signIn (opts) {
    return new Ember.RSVP.Promise ((resolve, reject) => {
      const tokenOptions = Ember.merge ({
        grant_type: 'password',
      }, opts);

      this._getToken (tokenOptions)
        .then ((token) => {
          // Store the access token in local storage.
          this._setUserToken (token);

          // Query the service for the current user. We are going to cache their id
          // just in case the application needs to use it.
          this.get ('store')
            .queryRecord ('account', {})
            .then ((account) => {
              this._setCurrentUser (account._id);
              this._completeSignIn ();

              Ember.run (null, resolve);
            })
            .catch (() => {
              // Even if we fail to get the current user, we still consider the login
              // to be a success.
              this._completeSignIn ();
              Ember.run (null, resolve);
            });
        })
        .catch (reject);
    });
  },

  /**
   * Sign out of the service.
   *
   * @returns {RSVP.Promise|*}
   */
  signOut () {
    return new Ember.RSVP.Promise ((resolve, reject) => {
      const url = this.computeUrl ('/oauth2/logout');
      const accessToken = this.get ('_userToken.access_token');

      const ajaxOptions = {
        type: 'POST',
        url: url,
        cache: false,
        headers: {
          'Authorization': 'Bearer ' + accessToken,
        },

        success () {
          // Reset the state of the service, and send an event.
          this._completeSignOut ();
          Ember.run (null, resolve);
        },

        error (xhr) {
          if (xhr.status === 401) {
            // The token is bad. Try to refresh the token, then attempt to sign out the
            // user again in a graceful manner.
            this.refreshToken ()
              .then (() => { return this.signOut (); })
              .then (resolve)
              .catch (reject);
          }
          else {
            // Force a reset, then mark the promise as resolved.
            this._completeSignOut ();

            Ember.run (null, resolve);
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
    return new Ember.RSVP.Promise ((resolve, reject) => {
      const tokenOptions = {
        grant_type: 'refresh_token',
        refresh_token: this.get ('_userToken.refresh_token')
      };

      this._getToken (tokenOptions)
        .then ((token) => {
          // Replace the current user token with this new token, and resolve.
          this._setUserToken (token);
          Ember.run (null, resolve);
        })
        .catch ((xhr) => {
          // Reset the state of the service. The client, if observing the sign in
          // state of the user, should show the authentication form.
          this.forceSignOut ();

          // Run the reject method.
          Ember.run (null, reject, xhr);
        });
    });
  },

  /**
   * Create a new account.
   *
   * @param account             Account details
   * @param opts                Creation options
   * @returns {*|RSVP.Promise}
   */
  createAccount (account, opts) {
    opts = opts || {};

    return new Ember.RSVP.Promise ((resolve, reject) => {
      const tokenOptions = {recaptcha: opts.recaptcha};

      this._getClientToken (tokenOptions)
        .then ((token) => {
          let url = this.computeUrl ('/accounts');

          if (opts.login) {
            url += '?login=true';
          }

          const ajaxOptions = {
            method: 'POST',
            url: url,
            cache: false,
            dataType: 'json',
            contentType: 'application/json',
            data: JSON.stringify ({account: account}),
            headers: {
              'Authorization': 'Bearer ' + token.access_token
            },

            success (payload) {
              if (opts.login) {
                // The client requested that we login the user for the account that
                // we just created. The payload should have both the account and the
                // user access token. Let's cache both.
                this._setUserToken (payload.token);
                this._setCurrentUser (payload.account._id);

                Ember.sendEvent (this, 'signedIn');
              }

              // Send the sign in event to all interested parties.
              Ember.run (null, resolve, payload);
            },

            error: reject
          };

          Ember.$.ajax (ajaxOptions);
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

  /**
   * Get a client token.
   *
   * @returns {RSVP.Promise|*}
   */
  _getClientToken (opts) {
    const tokenOptions = Ember.merge ({
      grant_type: 'client_credentials',
    }, opts);

    return this._getToken (tokenOptions);
  },

  _ajax (ajaxOptions) {
    const accessToken = this.get ('_userToken.access_token');

    ajaxOptions.headers = ajaxOptions.headers || {};
    ajaxOptions.headers.Authorization = 'Bearer ' + accessToken;

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
    return this.get ('baseUrl') + relativeUrl;
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
  },

  _setUserToken (token) {
    this.set ('_userToken', token);
    this.set (STORAGE_USER_TOKEN, token);
  },

  _clearUserToken () {
    this.set ('_userToken');
    this.set (STORAGE_USER_TOKEN);
  },

  _setCurrentUser (userId) {
    this.set ('currentUser', userId);
    this.set (STORAGE_CURRENT_USER, userId);
  },

  _clearCurrentUser () {
    this.set ('currentUser');
    this.set (STORAGE_CURRENT_USER);
  }
});
