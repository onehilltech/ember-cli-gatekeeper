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

  actions: {
    signOut () {
      this.signOut ();
    }
  },

  /**
   * Force the current user to sign out. This does not communicate the sign out
   * request to the server.
   */
  forceSignOut () {
    this.setProperties ({_accessToken: null, _currentUser: null});
    this.trigger ('signedOut');
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
    const tokenOptions = Ember.merge ({grant_type: 'password'}, opts);

    return this._requestToken (tokenOptions).then (token => {
      this.set ('_accessToken', token);

      // Query the service for the current user. We are going to cache their id
      // just in case the application needs to use it.
      return this.get ('store').queryRecord ('account', {}).then (account => {
        this.set ('_currentUser', account.toJSON ({includeId: true}));
        this._completeSignIn ();
      }).catch (reason => {
        this.set ('_accessToken');
        return Ember.RSVP.reject (reason);
      });
    });
  },

  /**
   * Sign out of the service.
   *
   * @returns {RSVP.Promise|*}
   */
  signOut () {
    const url = this.computeUrl ('/oauth2/logout');
    const ajaxOptions = {
      type: 'POST',
      url,
      headers: this.get ('_httpHeaders')
    };

    return Ember.$.ajax (ajaxOptions).then (result => {
      if (result) {
        this._completeSignOut ();
      }

      return Ember.RSVP.resolve (result);
    }).catch (xhr => {
      if (xhr.status === 401) {
        // The token is bad. Try to refresh the token, then attempt to sign out the
        // user again in a graceful manner.
        return this.refreshToken ().then (() => {
          return this.signOut ();
        });
      }
      else {
        return Ember.RSVP.reject (xhr);
      }
    });
  },

  /**
   * Manually refresh the access token for the current user.
   *
   * @returns {*|RSVP.Promise}
   */
  refreshToken () {
    const tokenOptions = {
      grant_type: 'refresh_token',
      refresh_token: this.get ('_accessToken.refresh_token')
    };

    return this._requestToken (tokenOptions).then ((token) => {
      // Replace the current user token with this new token, and resolve.
      this.set ('_accessToken', token);
    }).catch ((xhr) => {
      // Reset the state of the service. The client, if observing the sign in
      // state of the user, should show the authentication form.
      this.forceSignOut ();
      return Ember.RSVP.reject (xhr);
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
    let dupOptions = Ember.copy (ajaxOptions, false);

    dupOptions.headers = dupOptions.headers || {};
    dupOptions.headers.Authorization = `Bearer ${this.get ('accessToken.access_token')}`;

    return new Ember.RSVP.Promise ((resolve, reject) => {
      Ember.$.ajax (dupOptions).then (resolve).catch (xhr => {
        switch (xhr.status) {
          case 401:
            // Use the Gatekeeper service to refresh the token. If the token is refreshed,
            // then retry the original request. Otherwise, pass the original error to the
            // back to the client.
            this.refreshToken ()
              .then (() => this.ajax (dupOptions))
              .catch ((xhr) => Ember.run (null, reject, xhr));
            break;

          default:
            Ember.run (null, reject, xhr);
        }
      });
    });
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
  _requestToken (opts) {
    const url = this.computeUrl ('/oauth2/token');
    const tokenOptions = this.get ('client.tokenOptions');
    const data = Ember.assign ({}, tokenOptions, opts);

    const ajaxOptions = {
      method: 'POST',
      url: url,
      cache: false,
      dataType: 'json',
      contentType: 'application/json',
      data: JSON.stringify (data)
    };

    return Ember.$.ajax (ajaxOptions);
  },

  /**
   * Complete the sign in process.
   *
   * @private
   */
  _completeSignIn () {
    this.trigger ('signedIn');
  },

  /**
   * Complete the sign out process.
   *
   * @private
   */
  _completeSignOut () {
    this.forceSignOut ();
  }
});
