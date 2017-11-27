import DS from 'ember-data';
import { memberAction, collectionAction } from 'ember-api-actions';

export default DS.Model.extend({
  /// Email address for the account.
  email: DS.attr ('string'),

  /// Username of the account.
  username: DS.attr ('string'),

  /// Password for the account. The password is only used with the account is being
  /// created.
  password: DS.attr ('string'),

  /// The enabled state of the account.
  enabled: DS.attr ('boolean'),

  /// Change the password for the account.
  changePassword: memberAction ({ path: 'password', type: 'post', urlType: 'findRecord'})
});
