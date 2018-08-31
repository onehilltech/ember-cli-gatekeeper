import EmberObject from '@ember/object';
import Mixin from '@ember/object/mixin';

import { getOwner } from '@ember/application';
import { computed, get, observer } from '@ember/object';
import { bool, not, or, equal } from '@ember/object/computed';
import { isPresent } from '@ember/utils';
import { on } from '@ember/object/evented';

const ReCaptcha = EmberObject.extend ({
  reset: false,

  response: null,

  expired: false,

  execute: false,

  verified: bool ('response'),
  unverified: not ('verified'),

  v2: equal ('type', 'v2'),
  invisible: equal ('type', 'invisible'),

  componentName: computed ('type', function () {
    let type = this.get ('type');
    return `g-recaptcha-${type}`;
  })
});

export default Mixin.create ({
  recaptcha: null,
  recaptchaNotPresent: not ('recaptcha'),

  didInsertElement () {
    this._super (...arguments);

    let ENV = getOwner (this).resolveRegistration ('config:environment');
    let config = get (ENV, 'ember-cli-google.recaptcha');

    if (isPresent (config)) {
      // The object is using recaptcha. Let's instantiate a data class that will
      // manage the properties of a recaptcha.

      let type = config.type || 'invisible';
      let recaptcha = ReCaptcha.create ({type});

      this.set ('recaptcha', recaptcha);
    }
  },

  /// The verified state of the recaptcha. The recaptcha is verified if it is
  /// not present, or it is present and not verified.

  verified: or ('recaptchaNotPresent', 'recaptcha.verified'),

  /// The unverified state of the recaptcha.
  unverified: not ('verified')
});
