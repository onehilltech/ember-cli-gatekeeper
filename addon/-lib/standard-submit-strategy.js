import {default as Submit} from "./submit-strategy";

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
  submit () {
    this.get ('component').doSubmit ();
  }
});
