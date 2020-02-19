/* global KJUR */

import Service from '@ember/service';
import Evented from '@ember/object/evented';

import { isNone, isEmpty } from '@ember/utils';
import { inject as service } from '@ember/service';
import { computed } from '@ember/object';
import { alias, bool, not } from '@ember/object/computed';
import { Promise, reject, resolve, all } from 'rsvp';
import { run } from '@ember/runloop';
import { copy } from '@ember/object/internals';
import $ from 'jquery';

import TokenMetadata from '../-lib/token-metadata';

export default Service.extend (Evented, {
  gatekeeper: service (),
  storage: service ('local-storage'),
  store: service (),

  /// [private] The current authenticated user.
  currentUser: alias ('storage.gatekeeper_user'),
  accessToken: alias ('storage.gatekeeper_user_token'),

  /// The lock screen state for the session
  lockScreen: alias ('storage.gatekeeper_lock_screen'),

  /// Payload information contained in the access token.
  metadata: computed ('accessToken', function () {
    const accessToken = this.get ('accessToken.access_token');

    if (isNone (accessToken)) {
      return TokenMetadata.create ();
    }

    let parsed = KJUR.jws.JWS.parse (accessToken);
    return TokenMetadata.create (parsed.payloadObj);
  }),

  /// Test if the current user is signed in.
  isSignedIn: bool ('accessToken'),

  /// Test if the there is no user signed in.
  isSignedOut: not ('isSignedIn'),

  /// The current promise refreshing the access token.
  _refreshToken: null,

  /// The authentication url for a session.
  authenticateUrl: computed ('gatekeeper.authenticateUrl', function () {
    const authUrl = this.get ('gatekeeper.authenticateUrl');
    return isEmpty (authUrl) ? this.computeUrl ('/oauth2/token') : authUrl;
  }).readOnly (),

  refreshUrl: computed ('gatekeeper.refreshUrl', function () {
    const refreshUrl = this.get ('gatekeeper.refreshUrl');
    return isEmpty (refreshUrl) ? this.computeUrl ('/oauth2/token') : refreshUrl;
  }).readOnly (),

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
    this.setProperties ({accessToken: null, currentUser: null, lockScreen: false});
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
    const tokenOptions = Object.assign ({grant_type: 'password'}, opts);
    const authenticateUrl = this.get ('authenticateUrl');

    return this._requestToken (authenticateUrl, tokenOptions).then (token => {
      this.set ('accessToken', token);

      // Query the service for the current user. We are going to cache their id
      // just in case the application needs to use it.
      return this.get ('store').queryRecord ('account', {}).then (account => {
        this.set ('currentUser', account.toJSON ({includeId: true}));
        this._completeSignIn ();
      }).catch (reason => {
        this.set ('accessToken');
        return reject (reason);
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

    return $.ajax (ajaxOptions).then (result => {
      if (result) {
        this._completeSignOut ();
      }

      return resolve (result);
    }).catch (xhr => {
      if (xhr.status === 401) {
        // The token is bad. Try to refresh the token, then attempt to sign out the
        // user again in a graceful manner.
        return this.refreshToken ().then (() => {
          return this.signOut ();
        });
      }
      else {
        return reject (xhr);
      }
    });
  },

  /**
   * Authenticate the existing user. This is useful if you need to verify the current
   * user has access to a specific part of the application.
   *
   * @param password
   */
  authenticate (password) {
    const url = this.computeUrl ('/accounts/authenticate');
    const data = { authenticate: { password } };
    const adapter = this.store.adapterFor ('account');

    return adapter.ajax (url, 'POST', { data });
  },

  /**
   * Manually refresh the access token for the current user.
   *
   * @returns {*|RSVP.Promise}
   */
  refreshToken () {
    if (this._refreshToken) {
      return this._refreshToken;
    }

    this._refreshToken = new Promise ((resolve, reject) => {
      const tokenOptions = {
        grant_type: 'refresh_token',
        refresh_token: this.get ('accessToken.refresh_token')
      };

      this._requestToken (tokenOptions).then ((token) => {
        // Replace the current user token with this new token, reset the promise
        // variable for next time, and resolve the promise.
        this.set ('accessToken', token);
        this._refreshToken = null;
        resolve ();
      }).catch ((xhr) => {
        // Reset the state of the service. The client, if observing the sign in
        // state of the user, should show the authentication form.
        this.forceSignOut ();

        // Reset the promise variable since we are done refreshing the token, and
        // reject the promise.
        this._refreshToken = null;
        reject (xhr);
      });
    });

    return this._refreshToken;

  },

  _httpHeaders: computed ('accessToken', function () {
    return {Authorization: `Bearer ${this.get ('accessToken.access_token')}`};
  }),

  /**
   * Send an authorized AJAX request for the current user. The authorization
   * header will be added to the original request.
   *
   * @param ajaxOptions
   */
  ajax (ajaxOptions) {
    let dupOptions = copy (ajaxOptions, false);

    dupOptions.headers = dupOptions.headers || {};
    dupOptions.headers.Authorization = `Bearer ${this.get ('accessToken.access_token')}`;

    return new Promise ((resolve, reject) => {
      $.ajax (dupOptions).then (resolve).catch (xhr => {
        switch (xhr.status) {
          case 401:
            // Use the Gatekeeper service to refresh the token. If the token is refreshed,
            // then retry the original request. Otherwise, pass the original error to the
            // back to the client.
            this.refreshToken ()
              .then (() => this.ajax (dupOptions))
              .catch ((xhr) => run (null, reject, xhr));
            break;

          default:
            run (null, reject, xhr);
        }
      });
    });
  },

  computeUrl (relativeUrl) {
    return this.get ('gatekeeper').computeUrl (relativeUrl);
  },

  /**
   * Private method for requesting an access token from the server.
   *
   * @param url
   * @param opts
   * @private
   */
  _requestToken (url, opts) {
    const tokenOptions = this.get ('gatekeeper.tokenOptions');
    const data = Object.assign ({}, tokenOptions, opts);

    const ajaxOptions = {
      method: 'POST',
      url: url,
      cache: false,
      dataType: 'json',
      contentType: 'application/json',
      data: JSON.stringify (data)
    };

    return $.ajax (ajaxOptions)
      .then (token => {
        // Verify the access token and refresh token, if applicable.
        let gatekeeper = this.get ('gatekeeper');

        return all ([
          gatekeeper.verifyToken (token.access_token),
          gatekeeper.verifyToken (token.refresh_token)
        ]).then (() => token);
      });
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
