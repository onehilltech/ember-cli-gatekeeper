import Model, { attr } from '@ember-data/model';
import { memberAction } from 'ember-api-actions';
import { fragment } from 'ember-data-model-fragments/attributes';
import { serializeAndPush } from "ember-blueprint-data";

export default class AccountModel extends Model {
  /// Email address for the account.
  @attr
  email;

  /// Username of the account.
  @attr
  username;

  /// Password for the account. The password is only used with the account is being
  /// created.
  @attr
  password;

  /// The enabled state of the account.
  @attr('boolean')
  enabled;

  /// The scope for the account. It will be an array of strings.
  @attr
  scope;

  /// Change the password for the account.
  changePassword = memberAction ({ path: 'password', type: 'post', urlType: 'findRecord'});

  /**
   * Resend the verification email.
   */
  resend = memberAction ({
    path: 'resend',
    type: 'post',
    urlType: 'findRecord',
    after: serializeAndPush ()
  });

  /// The account has been verified.
  @attr('boolean')
  verified;

  @fragment('account-verification')
  verification
}
