import { attr } from '@ember-data/model';
import MF from 'ember-data-model-fragments';

export default class AccountVerificationFragment extends MF.Fragment {
  @attr('boolean')
  required;

  @attr('attr')
  date;

  get isVerified () {
    return !!this.date;
  }

  @attr
  ipAddress;

  @attr
  lastEmail;

  @attr('date')
  lastEmailDate;
}
