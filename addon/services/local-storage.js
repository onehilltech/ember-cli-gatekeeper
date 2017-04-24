import Ember from 'ember';

export default Ember.Service.extend({
  _storage: window.localStorage,

  length: Ember.computed.alias ('_storage.length'),

  setItem (key, value) {
    this._storage.setItem (key, JSON.stringify (value));
  },

  getItem (key) {
    return this._storage.getItem (key);
  },

  removeItem (key) {
    this._storage.removeItem (key);
  },

  clear () {
    this._storage.clear ();
  }
});
