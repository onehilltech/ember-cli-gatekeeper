import EmberObject from '@ember/object';

/**
 * A temporary session for the current user.
 */

export default EmberObject.extend ({
  signOut () {
    const url = this.computeUrl ('/oauth2/logout');

    const options = {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${this.accessToken}`
      }
    };

    return fetch (url, options);
  },

  computeUrl (relativeUrl) {
    return this.gatekeeper.computeUrl (relativeUrl);
  },
});
