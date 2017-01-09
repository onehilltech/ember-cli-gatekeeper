import Ember from 'ember';
import layout from '../templates/components/gatekeeper-signout';

export default Ember.Component.extend({
  layout,

  tagName: 'a',

  label: 'Logout',

  click () {
    const config = Ember.getOwner (this).resolveRegistration ('config:environment');
    const baseURL = config.gatekeeper.baseURL || '';
    const url = baseURL + '/v' + config.version + '/oauth2/logout';
    const accessToken = this.get ('storage.accessToken');
    let self = this;

    return Ember.$.ajax ({
      type: 'POST',
      url: url,
      cache: false,
      headers: {
        'Authorization': 'Bearer ' + accessToken,
      },
      success (data) {
        if (data === true) {
          // Delete the access and refresh token from local storage.
          self.set ('storage.accessToken');
          self.set ('storage.refreshToken');

          self.get ('onSignOut') ();
        }
      },
      error (jqXHR, textStatus) {
        console.log ('There was an error: ' + textStatus);
      }
    });
  }
});
