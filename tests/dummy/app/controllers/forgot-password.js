import Controller from '@ember/controller';
import { action } from "@ember/object";

export default class ForgotPasswordController extends Controller {
  @action
  submitted () {
    this.snackbar.show ({ message: 'You should receive an email shortly.', dismiss: true });
  }
}
