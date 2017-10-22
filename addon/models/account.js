import DS from 'ember-data';
import { memberAction, collectionAction } from 'ember-api-actions';

export default DS.Model.extend({
  email: DS.attr ('string'),

  username: DS.attr ('string'),

  password: DS.attr ('string'),

  changePassword: memberAction ({ path: 'password', type: 'post', urlType: 'findRecord'})
});
