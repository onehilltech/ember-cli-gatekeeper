import { default as Submit } from "./submit-strategy";

/**
 * The standard sign in process.
 */
export default Submit.extend ({
  /// The standard sign is never has any additional reasons for
  /// being marked as disabled.
  disabled: false,

  /**
   * Initiate the sign in process.
   */
  signIn () {
    this.component.signIn ();
  },

  /**
   * Initiate the sign up process.
   */
  signUp () {
    this.component.signUp ();
  }
});
