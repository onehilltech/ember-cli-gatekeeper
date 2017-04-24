import Ember from 'ember';

const STORAGE_USER_TOKEN = 'storage.user_token';
const STORAGE_CURRENT_USER = 'storage.current_user';
const STORAGE_CLIENT_TOKEN = 'storage.client_token';

export default Ember.Service.extend({
  /// Reference to local storage.
  storage: Ember.inject.service ('storage'),

  /// Reference ot the Ember Data store.
  store: Ember.inject.service ('store'),

  init () {
    this._super (...arguments);

    this.set ('storage.prefix', 'gatekeeper');

    this._initFromLocalStorage ();

    // Initialize the service from the APP configuration.
    const ENV = Ember.getOwner (this).resolveRegistration ('config:environment');
    this.set ('clientId', ENV.APP.gatekeeper.clientId);
    this.set ('baseUrl', ENV.APP.gatekeeper.baseURL + '/v' + ENV.APP.gatekeeper.version);
  },

  _initFromLocalStorage () {
    const userToken = this.get (STORAGE_USER_TOKEN);

    if (!Ember.isNone (userToken)) {
      this.set ('userToken', userToken);
    }

    const clientToken = this.get (STORAGE_CLIENT_TOKEN);

    if (!Ember.isNone (clientToken)) {
      this.set ('clientToken', clientToken);
    }

    this.set ('currentUser', this.get (STORAGE_CURRENT_USER));
  },

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
   *
   * @returns {boolean}
   */
  isSignedIn: Ember.computed ('userToken', function () {
    const accessToken = this.get ('userToken');
    return !Ember.isNone (accessToken);
  }),

  /**
   * Sign in the user.
   *
   * @returns {*}
   */
  signIn (opts) {
    return new Ember.RSVP.Promise (function (resolve, reject) {
      const tokenOptions = Ember.merge ({
        grant_type: 'password',
      }, opts);

      this._getToken (tokenOptions)
        .then (function (token) {
          // Store the access token in local storage.
          this._setUserToken (token);

          // Query the service for the current user. We are going to cache their id
          // just in case the application needs to use it.
          this.get ('store')
            .queryRecord ('account', {})
            .then (function (account) {
              this._setCurrentUser (account._id);
              this._completeSignIn (resolve);
            }.bind (this))
            .catch (function () {
              // Even if we fail to get the current user, we still consider the login
              // to be a success.
              this._completeSignIn (resolve);
            }.bind (this));
        }.bind (this))
        .catch (reject);
    }.bind (this));
  },

  /**
   * Sign out of the service.
   *
   * @returns {RSVP.Promise|*}
   */
  signOut () {
    return new Ember.RSVP.Promise (function (resolve, reject) {
      const url = this.computeUrl ('/oauth2/logout');
      const accessToken = this.get ('userToken.access_token');

      const ajaxOptions = {
        type: 'POST',
        url: url,
        cache: false,
        headers: {
          'Authorization': 'Bearer ' + accessToken,
        },
        success: function () {
          // Reset the state of the service, and send an event.
          this._completeSignOut ();
          Ember.run (null, resolve);
        }.bind (this),

        error: function (xhr) {
          if (xhr.status === 401) {
            // The token is bad. Try to refresh the token, then attempt to sign out the
            // user again in a graceful manner.
            this.refreshToken ()
              .then (function () {
                return this.signOut ();
              }.bind (this))
              .then (resolve)
              .catch (reject);
          }
          else {
            // Force a reset, then mark the promise as resolved.
            this._completeSignOut ();

            Ember.run (null, resolve);
          }
        }.bind (this)
      };

      Ember.$.ajax (ajaxOptions);
    }.bind (this));
  },

  /**
   * Manually refresh the access token for the current user.
   *
   * @returns {*|RSVP.Promise}
   */
  refreshToken () {
    return new Ember.RSVP.Promise (function (resolve, reject) {
      const tokenOptions = {
        grant_type: 'refresh_token',
        refresh_token: this.get ('userToken.refresh_token')
      };

      this._getToken (tokenOptions)
        .then (function (token) {
          // Replace the current user token with this new token, and resolve.
          this._setUserToken (token);
          Ember.run (null, resolve);
        }.bind (this))
        .catch (function (xhr) {
          // Reset the state of the service. The client, if observing the sign in
          // state of the user, should show the authentication form.
          this.forceSignOut ();

          // Run the reject method.
          Ember.run (null, reject, xhr);
        }.bind (this));
    }.bind (this));
  },

  /**
   * Get a client token.
   *
   * @returns {RSVP.Promise|*}
   */
  getClientToken (opts) {
    return new Ember.RSVP.Promise (function (resolve, reject) {
      const tokenOptions = Ember.merge ({
        grant_type: 'client_credentials',
      }, opts);

      this._getToken (tokenOptions)
        .then (function (token) {
          // Replace the current client token, and resolve.
          this._setClientToken (token);
          Ember.run (null, resolve);
        }.bind (this))
        .catch (reject);
    }.bind (this));
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

    return new Ember.RSVP.Promise (function (resolve, reject) {
      const tokenOptions = {recaptcha: opts.recaptcha};

      this.getClientToken (tokenOptions)
        .then (function (token) {
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
            success: function (payload) {
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
            }.bind (this),
            error: reject
          };

          Ember.$.ajax (ajaxOptions);
        })
        .catch (reject);
    }.bind (this));
  },

  /**
   * Send an authorized AJAX request for the current user. The authorization
   * header will be added to the original request.
   *
   * @param ajaxOptions
   */
  ajax (ajaxOptions) {
    return this._ajaxUserOrClient (ajaxOptions, 'user');
  },

  ajaxClient (ajaxOptions) {
    return this._ajaxUserOrClient (ajaxOptions, 'client');
  },

  _ajaxUserOrClient (ajaxOptions, kind) {
    return new Ember.RSVP.Promise (function (resolve, reject) {
      let dupOptions = Ember.copy (ajaxOptions, false);

      dupOptions.success = function (payload, textStatus, jqXHR) {
        Ember.run (null, resolve, {payload: payload, status: textStatus, xhr: jqXHR});
      };

      dupOptions.error = function (xhr, textStatus, errorThrown) {
        switch (xhr.status) {
          case 401:
            // Use the Gatekeeper service to refresh the token. If the token is refreshed,
            // then retry the original request. Otherwise, pass the original error to the
            // back to the client.
            this.refreshToken ()
              .then (function () {
                this._ajaxRequest (dupOptions, kind);
              }.bind (this))
              .catch (function (xhr, textStatus, error) {
                if (kind === 'user') {
                  this.forceSignOut ();
                }
                else {
                  this._clearClientToken ();
                }

                Ember.run (null, reject, {xhr: xhr, status: textStatus, error: error});
              }.bind (this));
            break;

          case 403:
            if (kind === 'user') {
              this.forceSignOut ();
            }
            else {
              this._clearClientToken ();
            }
            Ember.run (null, reject, {xhr: xhr, status: textStatus, error: errorThrown});
            break;

          default:
            Ember.run (null, reject, {xhr: xhr, status: textStatus, error: errorThrown});
        }
      }.bind (this);

      this._ajaxRequest (dupOptions, kind);
    }.bind (this));
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
    return new Ember.RSVP.Promise (function (resolve, reject) {
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
    }.bind (this));
  },

  /**
   * Complete the sign in process.
   *
   * @param resolve
   * @private
   */
  _completeSignIn (resolve) {
    Ember.sendEvent (this, 'signedIn');
    Ember.run (null, resolve);
  },

  _setUserToken (token) {
    this.set ('userToken', token);
    this.set (STORAGE_USER_TOKEN, token);
  },

  _clearUserToken () {
    this.set (STORAGE_USER_TOKEN);
    this.set ('userToken')
  },

  _setClientToken (token) {
    this.set ('clientToken', token);
    this.set (STORAGE_CLIENT_TOKEN, token);
  },

  _clearClientToken () {
    this.set (STORAGE_CLIENT_TOKEN);
    this.set ('clientToken');
  },

  _setCurrentUser (userId) {
    this.set ('currentUser', userId);
    this.set (STORAGE_CURRENT_USER, userId);
  },

  _clearCurrentUser () {
    this.set ('currentUser');
    this.set (STORAGE_CURRENT_USER);
  },

  /**
   * Complete the sign out process.
   *
   * @private
   */
  _completeSignOut () {
    this.forceSignOut ()
    Ember.sendEvent (this, 'signedOut');
  },

  _ajaxRequest (ajaxOptions, kind) {
    const accessToken = kind === 'user' ? this.get ('userToken.access_token') : this.get ('clientToken.access_token');

    ajaxOptions.headers = ajaxOptions.headers || {};
    ajaxOptions.headers.Authorization = 'Bearer ' + accessToken;

    Ember.$.ajax (ajaxOptions);
  }
});
