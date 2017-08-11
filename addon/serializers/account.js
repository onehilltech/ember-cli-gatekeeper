import Ember from 'ember';
import DS from 'ember-data';

export default DS.RESTSerializer.extend({
  primaryKey: '_id',

  keyForAttribute (key) {
    return Ember.String.underscore (key);
  }
});
