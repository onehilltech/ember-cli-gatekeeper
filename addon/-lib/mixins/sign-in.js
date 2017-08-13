import Ember from 'ember';

/**
 * SignInMixin allows you to add sign in support to any object in EmberJS. It
 * is primarily used both Ember.Controller and Ember.Component objects. The
 * mixin supplies a signIn action, and states that inform the client of its
 * progress.
 *
 * Use \a signInOptions property to pass options to the sign in process.
 */
export default Ember.Mixin.create ({
  gatekeeper: Ember.inject.service (),

  actions: {
    signIn () {
      if (!this._validateForm ()) { return; }

      let username = this.get ('username');
      let password = this.get ('password');
      let signInOptions = this.get ('signInOptions');
      let opts = Ember.merge ({username: username, password: password}, signInOptions);

      // Let them know we have started the sign in process.
      this.set ('isSigningIn', true);

      this.get ('gatekeeper').signIn (opts).then (() => {
        // Notify all that we are finish with the sign in process.
        this.set ('isSigningIn', false);
        this.didSignIn ();
      }, (xhr) => {
        if (xhr.status === 400) {
          let errors = xhr.responseJSON.errors;

          switch (errors.code) {
            case 'invalid_username':
              this.setProperties ({isSigningIn: false, usernameErrorMessage: errors.message});
              break;

            case 'invalid_password':
              this.setProperties ({isSigningIn: false, passwordErrorMessage: errors.message});
              break;

            default:
              this.set ({isSigningIn: false, errorMessage: errorMessage});
          }
        }
        else {
          this.setProperties ({isSigningIn: false, errorMessage: xhr.message});
        }
      });
    }
  },

  _validateForm () {
    let username = this.getTextField ('input.username');
    let password = this.getTextField ('input.password');

    if (username.element.validity.customError) {
      username.element.setCustomValidity ("");
    }

    if (password.element.validity.customError) {
      password.element.setCustomValidity ("");
    }

    username.doValidate ();
    password.doValidate ();

    return username.element.validity.valid & password.element.validity.valid;
  },

  getTextField (selector) {
    let input = this.$ (selector)[0];
    let views = Ember.getOwner (this).lookup ('-view-registry:main');
    return views[input.id];
  }
});
